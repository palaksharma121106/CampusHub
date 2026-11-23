import time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models import ChatMessage, ChatSession, QueryLog, User
from app.rag.pipeline import get_pipeline
from app.schemas.assistant import AskRequest, AskResponse, ChatSessionDetail, ChatSessionOut

router = APIRouter(prefix="/assistant", tags=["assistant"])

SUGGESTED = [
    "What is the fee structure for B.Tech Computer Science?",
    "What are the library timings?",
    "Who is the head of the Computer Science department?",
    "Is there a doctor available on campus at night?",
    "What hostels are available for girls?",
    "What topics are covered in Database Management Systems?",
]


def _own_session(db: Session, user: User, session_id: int) -> ChatSession:
    chat = db.get(ChatSession, session_id)
    if not chat or chat.user_id != user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return chat


@router.post("/ask", response_model=AskResponse)
def ask(payload: AskRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    started = time.perf_counter()
    question = payload.question.strip()
    if payload.session_id:
        chat = _own_session(db, user, payload.session_id)
    else:
        chat = ChatSession(user_id=user.id, title=question[:80])
        db.add(chat)
        db.flush()
    history = [(m.role, m.content) for m in chat.messages[-6:]]

    result = get_pipeline().answer(db, question, history)
    elapsed = int((time.perf_counter() - started) * 1000)

    db.add(ChatMessage(session_id=chat.id, role="user", content=question))
    reply = ChatMessage(session_id=chat.id, role="assistant", content=result.answer, sources=result.sources_dict())
    db.add(reply)
    db.add(QueryLog(user_id=user.id, query_text=question, input_mode=payload.input_mode, answered=result.answered,
                    source_count=len(result.sources), generator=result.generator, response_time_ms=elapsed))
    chat.updated_at = func.now()
    db.commit()
    return AskResponse(session_id=chat.id, message_id=reply.id, answer=result.answer, sources=result.sources_dict(),
                       answered=result.answered, generator=result.generator, response_time_ms=elapsed)


@router.get("/suggestions", response_model=list[str])
def suggestions(_: User = Depends(get_current_user)):
    return SUGGESTED


@router.get("/popular", response_model=list[dict])
def popular(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.execute(
        select(func.lower(QueryLog.query_text).label("q"), func.count().label("n"))
        .where(QueryLog.answered.is_(True)).group_by("q").order_by(func.count().desc()).limit(6)
    ).all()
    return [{"question": q, "count": n} for q, n in rows]


@router.get("/recent", response_model=list[dict])
def recent(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.scalars(select(QueryLog).where(QueryLog.user_id == user.id).order_by(QueryLog.id.desc()).limit(6)).all()
    return [{"question": r.query_text, "answered": r.answered, "created_at": r.created_at} for r in rows]


@router.get("/sessions", response_model=list[ChatSessionOut])
def sessions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(select(ChatSession).where(ChatSession.user_id == user.id)
                      .order_by(ChatSession.updated_at.desc(), ChatSession.id.desc()).limit(30)).all()


@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
def session_detail(session_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _own_session(db, user, session_id)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.delete(_own_session(db, user, session_id))
    db.commit()
