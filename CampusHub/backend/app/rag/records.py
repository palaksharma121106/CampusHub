"""Turn structured database records into retrievable text passages."""
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models as m


@dataclass
class RecordPassage:
    key: str  # e.g. "fee_structures:3"
    section: str
    title: str
    text: str
    link: str


def _money(v) -> str:
    return f"Rs. {float(v):,.0f}"


def _join(*parts: str | None) -> str:
    return " ".join(p.strip() for p in parts if p and p.strip())


def build_record_passages(db: Session) -> list[RecordPassage]:
    out: list[RecordPassage] = []
    add = out.append

    for d in db.scalars(select(m.Department)):
        add(RecordPassage(f"departments:{d.id}", "Departments", d.name, _join(
            f"Department of {d.name} ({d.code}).", d.description,
            f"Head of Department (HOD): {d.hod_name}." if d.hod_name else None,
            f"Location: {d.location}." if d.location else None,
            f"Email: {d.email}." if d.email else None, f"Phone: {d.phone}." if d.phone else None), "/app/departments"))

    for p in db.scalars(select(m.AcademicProgram)):
        add(RecordPassage(f"academic_programs:{p.id}", "Academic Programs", p.name, _join(
            f"{p.name} ({p.code}) is a {p.duration_years}-year {p.level} programme offered by the {p.department_name} department.",
            f"Intake: {p.total_seats} seats." if p.total_seats else None,
            f"Eligibility: {p.eligibility}" if p.eligibility else None, p.description), "/app/programs"))

    for c in db.scalars(select(m.Course)):
        add(RecordPassage(f"courses:{c.id}", "Courses", f"{c.code} {c.title}", _join(
            f"Course {c.code} – {c.title} is a {c.credits}-credit {c.course_type.lower()} course in semester {c.semester}",
            f"of {c.program_name}, offered by {c.department_name}.", c.description), "/app/courses"))

    for s in db.scalars(select(m.Subject)):
        add(RecordPassage(f"subjects:{s.id}", "Subjects", f"{s.code} {s.name}", _join(
            f"Subject {s.code} – {s.name} ({s.component}, {s.credits} credits) is part of course {s.course_code} {s.course_title}, semester {s.semester}.",
            f"{s.weekly_hours} hours per week." if s.weekly_hours else None,
            f"Taught by {s.faculty_name}." if s.faculty_name else None), "/app/subjects"))

    for u in db.scalars(select(m.Syllabus)):
        add(RecordPassage(f"syllabus:{u.id}", "Syllabus", f"{u.course_code} Unit {u.unit_number}", _join(
            f"Syllabus of {u.course_code} {u.course_title}, Unit {u.unit_number}: {u.title}. Topics: {u.topics.rstrip('.')}.",
            f"Teaching hours: {u.hours}." if u.hours else None,
            f"Reference books: {u.reference_books}." if u.reference_books else None), "/app/syllabus"))

    for f in db.scalars(select(m.Faculty)):
        add(RecordPassage(f"faculty:{f.id}", "Faculty Directory", f.name, _join(
            f"{f.name} is {f.designation} in the {f.department_name} department.",
            f"Qualification: {f.qualification}." if f.qualification else None,
            f"Specialisation: {f.specialization}." if f.specialization else None,
            f"Office: {f.office}." if f.office else None, f"Email: {f.email}." if f.email else None,
            f"Phone: {f.phone}." if f.phone else None,
            f"Experience: {f.experience_years} years." if f.experience_years is not None else None), "/app/faculty"))

    for fee in db.scalars(select(m.FeeStructure)):
        add(RecordPassage(f"fee_structures:{fee.id}", "Fee Structure", f"{fee.program_name} fees {fee.academic_year}", _join(
            f"Fee structure for {fee.program_name}, academic year {fee.academic_year}, year {fee.year_of_study}:",
            f"tuition fee {_money(fee.tuition_fee)}, hostel fee {_money(fee.hostel_fee)}, examination fee {_money(fee.exam_fee)},",
            f"other charges {_money(fee.other_fee)}; total {_money(fee.total_fee)} per year.", fee.notes), "/app/fees"))

    for r in db.scalars(select(m.LibraryResource)):
        add(RecordPassage(f"library_resources:{r.id}", "Library", r.title, _join(
            f"Library – {r.title} ({r.category}).", r.description,
            f"Timings: {r.timings}." if r.timings else None, f"Location: {r.location}." if r.location else None), "/app/library"))

    for c in db.scalars(select(m.CampusFacility)):
        section = "Hostel Facilities" if c.category == "Hostel" else "Campus Services"
        add(RecordPassage(f"campus_facilities:{c.id}", section, c.name, _join(
            f"{c.name} ({c.category}).", c.description, f"Location: {c.location}." if c.location else None,
            f"Timings: {c.timings}." if c.timings else None, f"Capacity: {c.capacity}." if c.capacity else None,
            f"Contact: {c.contact}." if c.contact else None), "/app/hostels" if c.category == "Hostel" else "/app/campus"))

    for x in db.scalars(select(m.MedicalFacility)):
        add(RecordPassage(f"medical_facilities:{x.id}", "Medical Facilities", x.name, _join(
            f"{x.name} ({x.facility_type}).", x.description, f"Location: {x.location}." if x.location else None,
            f"Timings: {x.timings}." if x.timings else None, f"Doctor: {x.doctor_name}." if x.doctor_name else None,
            f"Contact: {x.contact_phone}." if x.contact_phone else None,
            "Available for emergencies." if x.is_emergency else None), "/app/medical"))

    for c in db.scalars(select(m.ImportantContact)):
        add(RecordPassage(f"important_contacts:{c.id}", "Important Contacts", f"{c.office} – {c.name}", _join(
            f"{c.office}: {c.name}" + (f", {c.designation}." if c.designation else "."),
            f"Phone: {c.phone}." if c.phone else None, f"Email: {c.email}." if c.email else None,
            f"Available: {c.available_hours}." if c.available_hours else None,
            "Emergency contact." if c.is_emergency else None), "/app/contacts"))

    for a in db.scalars(select(m.Announcement).where(m.Announcement.is_published.is_(True))):
        add(RecordPassage(f"announcements:{a.id}", "Announcements", a.title, _join(
            f"Announcement ({a.category}, posted {a.created_at:%d %b %Y}): {a.title}.", a.content), "/app/dashboard"))

    return out
