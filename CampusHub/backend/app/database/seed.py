"""Load clearly-labelled DEMONSTRATION data. None of this is real institutional information.

Usage:  python -m app.database.seed          (idempotent: skips if departments already exist)
        python -m app.database.seed --reset  (drops and recreates all tables first)
"""
import sys
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import select

from app import models as m
from app.core.security import hash_password
from app.database.init_db import create_tables, ensure_roles_and_admin
from app.database.session import Base, SessionLocal, engine

DEMO = "[Demo data] "

DEPARTMENTS = [
    ("Computer Science & Engineering", "CSE", "Dr. Ananya Rao", "Block A, 2nd Floor",
     "Undergraduate and postgraduate programmes in computing, AI, data science and software systems."),
    ("Electronics & Communication Engineering", "ECE", "Dr. Vikram Mehta", "Block B, 1st Floor",
     "VLSI, embedded systems, signal processing and communication networks."),
    ("Mechanical Engineering", "ME", "Dr. Sanjay Kulkarni", "Block C, Ground Floor",
     "Design, thermal sciences, manufacturing and robotics."),
    ("School of Management", "SOM", "Dr. Priya Nair", "Management Block, 3rd Floor",
     "Business administration with specialisations in finance, marketing and analytics."),
    ("Applied Sciences & Humanities", "ASH", "Dr. Rakesh Verma", "Block D, 1st Floor",
     "Mathematics, physics, chemistry and communication skills for first-year students."),
]

PROGRAMS = [
    ("B.Tech Computer Science & Engineering", "BTECH-CSE", "UG", "CSE", 4, 120,
     "10+2 with Physics, Mathematics and Chemistry/Computer Science, minimum 60% aggregate, plus entrance score."),
    ("B.Tech CSE (Artificial Intelligence & ML)", "BTECH-AIML", "UG", "CSE", 4, 60,
     "10+2 with Physics and Mathematics, minimum 60% aggregate."),
    ("M.Tech Computer Science", "MTECH-CS", "PG", "CSE", 2, 18, "B.Tech/B.E. in CS/IT or related field with 60% marks."),
    ("B.Tech Electronics & Communication", "BTECH-ECE", "UG", "ECE", 4, 60, "10+2 with Physics and Mathematics, minimum 55%."),
    ("B.Tech Mechanical Engineering", "BTECH-ME", "UG", "ME", 4, 60, "10+2 with Physics and Mathematics, minimum 55%."),
    ("Master of Business Administration", "MBA", "PG", "SOM", 2, 90, "Any graduate with 50% marks and a valid management aptitude score."),
    ("Bachelor of Business Administration", "BBA", "UG", "SOM", 3, 90, "10+2 in any stream with 50% marks."),
    ("Ph.D. Computer Science", "PHD-CS", "Doctoral", "CSE", 3, 8, "Master's degree in a relevant discipline with 55% marks."),
]

FACULTY = [
    ("Dr. Ananya Rao", "Professor & Head", "CSE", "Ph.D. (Computer Science)", "Machine Learning, Information Retrieval", "A-201", 18),
    ("Dr. Rohan Sharma", "Associate Professor", "CSE", "Ph.D. (Databases)", "Database Systems, Big Data", "A-204", 12),
    ("Prof. Meera Iyer", "Assistant Professor", "CSE", "M.Tech (CSE)", "Data Structures, Algorithms", "A-207", 7),
    ("Dr. Karan Malhotra", "Associate Professor", "CSE", "Ph.D. (Networks)", "Computer Networks, Cyber Security", "A-210", 11),
    ("Prof. Sneha Joshi", "Assistant Professor", "CSE", "M.Tech (AI)", "Natural Language Processing, Deep Learning", "A-212", 5),
    ("Dr. Arjun Patel", "Professor", "CSE", "Ph.D. (Software Engineering)", "Software Engineering, Cloud Computing", "A-215", 20),
    ("Dr. Vikram Mehta", "Professor & Head", "ECE", "Ph.D. (VLSI Design)", "VLSI, Embedded Systems", "B-101", 19),
    ("Prof. Nisha Gupta", "Assistant Professor", "ECE", "M.Tech (Communication)", "Wireless Communication", "B-105", 6),
    ("Dr. Sanjay Kulkarni", "Professor & Head", "ME", "Ph.D. (Thermal Engineering)", "Heat Transfer, IC Engines", "C-001", 22),
    ("Dr. Farhan Ali", "Associate Professor", "ME", "Ph.D. (Robotics)", "Robotics, Mechatronics", "C-006", 10),
    ("Dr. Priya Nair", "Professor & Dean", "SOM", "Ph.D. (Finance)", "Corporate Finance, Investment Analysis", "M-301", 17),
    ("Prof. Aditya Bose", "Assistant Professor", "SOM", "MBA, UGC-NET", "Marketing Analytics", "M-305", 6),
    ("Dr. Rakesh Verma", "Professor & Head", "ASH", "Ph.D. (Mathematics)", "Linear Algebra, Probability", "D-101", 21),
    ("Dr. Kavita Singh", "Assistant Professor", "ASH", "Ph.D. (Physics)", "Engineering Physics, Optics", "D-104", 8),
]

CSE_COURSES = [
    ("CS101", "Programming Fundamentals with C", 1, 4, "Core", "Problem solving, control structures, functions, arrays, pointers and file handling in C."),
    ("MA101", "Engineering Mathematics I", 1, 4, "Core", "Calculus, sequences and series, and matrices."),
    ("CS201", "Data Structures", 3, 4, "Core", "Arrays, linked lists, stacks, queues, trees, graphs, hashing and their applications."),
    ("CS203", "Object-Oriented Programming with Java", 3, 3, "Core", "Classes, inheritance, polymorphism, exceptions, collections and multithreading."),
    ("CS301", "Database Management Systems", 5, 4, "Core", "Relational model, SQL, normalisation, transactions, indexing and query processing."),
    ("CS303", "Computer Networks", 5, 4, "Core", "OSI/TCP-IP models, routing, transport protocols and network security basics."),
    ("CS305", "Operating Systems", 5, 4, "Core", "Processes, scheduling, synchronisation, memory management and file systems."),
    ("CS401", "Machine Learning", 7, 3, "Elective", "Supervised and unsupervised learning, model evaluation and neural networks."),
    ("CS403", "Natural Language Processing", 7, 3, "Elective", "Text processing, embeddings, transformers and retrieval-augmented generation."),
    ("CS499", "Major Project", 8, 8, "Project", "Final-year group project carried out under faculty supervision."),
]

SYLLABUS = {
    "CS301": [
        (1, "Introduction & ER Model", "Database concepts, DBMS architecture, data models, ER diagrams, keys and constraints.", 8),
        (2, "Relational Model & SQL", "Relational algebra, SQL DDL/DML, joins, sub-queries, views and stored procedures.", 10),
        (3, "Normalisation", "Functional dependencies, 1NF, 2NF, 3NF, BCNF, decomposition and lossless joins.", 8),
        (4, "Transactions & Concurrency", "ACID properties, schedules, serialisability, locking protocols, deadlocks and recovery.", 9),
        (5, "Storage & Indexing", "File organisation, B+ trees, hashing, query processing and optimisation.", 7),
    ],
    "CS201": [
        (1, "Arrays & Linked Lists", "Abstract data types, arrays, singly/doubly/circular linked lists.", 8),
        (2, "Stacks & Queues", "Stack and queue implementations, expression evaluation, circular and priority queues.", 8),
        (3, "Trees", "Binary trees, traversals, binary search trees, AVL trees and heaps.", 10),
        (4, "Graphs", "Representations, BFS, DFS, shortest paths and minimum spanning trees.", 10),
        (5, "Sorting, Searching & Hashing", "Quick sort, merge sort, heap sort, binary search and hash tables.", 8),
    ],
    "CS401": [
        (1, "Foundations", "Types of learning, bias-variance trade-off, data pre-processing.", 6),
        (2, "Supervised Learning", "Linear and logistic regression, decision trees, SVM, k-NN.", 10),
        (3, "Unsupervised Learning", "k-means, hierarchical clustering, PCA.", 8),
        (4, "Neural Networks", "Perceptron, back-propagation, CNN and RNN basics.", 10),
    ],
}

LIBRARY = [
    ("Central Library – Regular Timings", "Timings", "Monday to Saturday: 8:00 AM – 10:00 PM. Sunday: 10:00 AM – 6:00 PM.", "Library Block", "Mon–Sat 8:00 AM–10:00 PM; Sun 10:00 AM–6:00 PM"),
    ("Examination Period Timings", "Timings", "During end-semester examinations the reading hall stays open 24 hours.", "Library Block, Reading Hall", "24×7 during exams"),
    ("Book Borrowing Rules", "Rule", "Undergraduate students may borrow up to 4 books for 14 days. Postgraduate students may borrow up to 6 books for 21 days. A late fee of Rs. 5 per book per day applies.", None, None),
    ("Digital Library & E-Journals", "E-Resource", "Access to IEEE Xplore, ACM Digital Library, Springer and NPTEL video lectures from the campus network or via remote login.", "Library Block, 1st Floor", "Mon–Sat 9:00 AM–8:00 PM"),
    ("Reference & Periodicals Section", "Section", "Reference books, encyclopaedias, newspapers and over 120 national and international journals.", "Library Block, Ground Floor", None),
    ("Book Bank Scheme", "Service", "Eligible students may borrow a full semester's textbooks through the book bank. Apply at the circulation desk in the first two weeks of the semester.", "Circulation Desk", None),
]

FACILITIES = [
    ("Aravali Boys Hostel", "Hostel", "Boys' hostel with twin-sharing rooms, Wi-Fi, a common room, laundry service and a mess serving four meals a day. Hostel gates close at 10:30 PM.", "North Campus", "Warden office: 9 AM – 6 PM", "Warden: Mr. R. K. Singh, Ext. 4101", 400),
    ("Saraswati Girls Hostel", "Hostel", "Girls' hostel with twin and triple-sharing rooms, 24×7 security, CCTV, Wi-Fi, gym and a mess. In-time is 9:30 PM.", "South Campus", "Warden office: 9 AM – 6 PM", "Warden: Mrs. Sunita Sharma, Ext. 4201", 350),
    ("International & PG Hostel", "Hostel", "Single-occupancy rooms for postgraduate and international students with attached bathrooms.", "East Campus", "Warden office: 10 AM – 5 PM", "Warden: Dr. P. Menon, Ext. 4301", 120),
    ("Central Cafeteria", "Dining", "Multi-cuisine cafeteria and coffee counter.", "Near Academic Block A", "7:30 AM – 9:30 PM", "Ext. 4500", 300),
    ("Sports Complex", "Sports", "Indoor badminton, table tennis, gym, outdoor cricket ground, football field and basketball courts.", "West Campus", "6:00 AM – 9:00 PM", "Sports Officer, Ext. 4600", None),
    ("Campus Bus Service", "Transport", "Buses run between the campus and the city railway station every 30 minutes.", "Main Gate", "7:00 AM – 8:00 PM", "Transport Office, Ext. 4700", None),
    ("Innovation & Incubation Lab", "Laboratory", "Maker space with 3D printers, IoT kits and GPU workstations for student projects.", "Block A, Basement", "9:00 AM – 9:00 PM", "Lab In-charge, Ext. 4800", 60),
    ("Bank & ATM", "Services", "Bank branch and two ATMs on campus.", "Admin Block", "Bank: 10 AM – 4 PM; ATM: 24×7", None, None),
]

MEDICAL = [
    ("Campus Health Centre", "Primary Care", "General OPD, first aid, basic diagnostics and free consultation for students.", "Near Saraswati Hostel", "8:00 AM – 8:00 PM (all days)", "Ext. 4900", "Dr. Neha Kapoor (MBBS)", False),
    ("24×7 Emergency Room", "Emergency", "Round-the-clock emergency care with a resident medical officer and nurse on duty.", "Campus Health Centre", "24×7", "Ext. 4999 / +91-90000-00001", "Resident Medical Officer", True),
    ("Ambulance Service", "Ambulance", "Ambulance available 24×7 for transfers to the partner city hospital.", "Main Gate", "24×7", "+91-90000-00002", None, True),
    ("Counselling & Wellness Cell", "Mental Health", "Confidential counselling sessions with a qualified psychologist. Book an appointment by email or walk in.", "Student Activity Centre, Room 12", "Mon–Fri 10:00 AM – 5:00 PM", "Ext. 4950", "Ms. Ritu Desai (Counselling Psychologist)", False),
    ("Campus Pharmacy", "Pharmacy", "Commonly prescribed medicines at subsidised rates.", "Campus Health Centre", "9:00 AM – 9:00 PM", "Ext. 4910", None, False),
]

CONTACTS = [
    ("Mr. Alok Tiwari", "Registrar", "Registrar Office", "+91-90000-10001", "registrar@campushub.demo", "Mon–Fri 10 AM – 5 PM", False),
    ("Ms. Pooja Arora", "Admissions Officer", "Admissions Office", "+91-90000-10002", "admissions@campushub.demo", "Mon–Sat 9 AM – 5 PM", False),
    ("Mr. Deepak Jain", "Accounts Officer", "Accounts & Fee Section", "+91-90000-10003", "accounts@campushub.demo", "Mon–Fri 10 AM – 4 PM", False),
    ("Dr. S. Banerjee", "Controller of Examinations", "Examination Cell", "+91-90000-10004", "exams@campushub.demo", "Mon–Fri 10 AM – 5 PM", False),
    ("Mr. Harish Rawat", "Chief Security Officer", "Campus Security", "+91-90000-00003", "security@campushub.demo", "24×7", True),
    ("Dr. Meenal Shah", "Dean of Student Welfare", "Student Welfare Office", "+91-90000-10005", "dsw@campushub.demo", "Mon–Fri 10 AM – 5 PM", False),
    ("Ms. Kritika Sen", "Training & Placement Officer", "Placement Cell", "+91-90000-10006", "placements@campushub.demo", "Mon–Fri 9:30 AM – 5:30 PM", False),
    ("Anti-Ragging Helpline", "Helpline", "Anti-Ragging Committee", "+91-90000-00004", "antiragging@campushub.demo", "24×7", True),
]

ANNOUNCEMENTS = [
    ("End-semester examination schedule released", "The end-semester examination timetable for all UG and PG programmes is now available. Examinations begin on the first Monday of December. Hall tickets can be collected from the Examination Cell.", "Examinations", "important"),
    ("Fee payment deadline for even semester", "Students must pay the even-semester fee by 15 January. A late fee of Rs. 100 per day applies after the deadline.", "Fees", "urgent"),
    ("Annual tech fest registrations open", "Registrations for the annual technical festival are open. Events include a hackathon, robotics challenge and paper presentations.", "Events", "normal"),
    ("Library extended hours during exams", "The central library reading hall will remain open 24×7 during the examination period.", "Library", "normal"),
    ("Campus placement drive – software roles", "A placement drive for final-year B.Tech students will be held next week. Register on the placement portal by Friday.", "Placements", "important"),
]

STUDENTS = [
    ("Aarav Gupta", "aarav.student@campushub.demo", "CSE22001", "CSE", "BTECH-CSE", 4),
    ("Isha Reddy", "isha.student@campushub.demo", "CSE23014", "CSE", "BTECH-AIML", 3),
    ("Rahul Verma", "rahul.student@campushub.demo", "ECE23007", "ECE", "BTECH-ECE", 3),
    ("Sana Khan", "sana.student@campushub.demo", "MBA24003", "SOM", "MBA", 1),
]


def seed(db) -> None:
    admin = ensure_roles_and_admin(db)
    if db.scalar(select(m.Department.id).limit(1)):
        print("Demo data already present – skipping (use --reset to reload).")
        return

    depts = {}
    for name, code, hod, loc, desc in DEPARTMENTS:
        d = m.Department(name=name, code=code, hod_name=hod, location=loc, description=DEMO + desc,
                         email=f"{code.lower()}@campushub.demo", phone=f"+91-90000-2{len(depts):04d}")
        db.add(d)
        depts[code] = d
    db.flush()

    progs = {}
    for name, code, level, dept, years, seats, elig in PROGRAMS:
        p = m.AcademicProgram(name=name, code=code, level=level, department_id=depts[dept].id, duration_years=years,
                              total_seats=seats, eligibility=elig, description=f"{DEMO}{name} offered by the {depts[dept].name} department.")
        db.add(p)
        progs[code] = p
    db.flush()

    fac = {}
    for name, desig, dept, qual, spec, office, exp in FACULTY:
        slug = name.lower().replace("dr. ", "").replace("prof. ", "").replace(" ", ".")
        f = m.Faculty(name=name, designation=desig, department_id=depts[dept].id, qualification=qual,
                      specialization=spec, office=office, experience_years=exp, email=f"{slug}@campushub.demo",
                      phone=f"Ext. {3000 + len(fac)}")
        db.add(f)
        fac[name] = f
    db.flush()

    courses = {}
    for code, title, sem, credits, ctype, desc in CSE_COURSES:
        c = m.Course(code=code, title=title, program_id=progs["BTECH-CSE"].id, department_id=depts["CSE"].id,
                     semester=sem, credits=credits, course_type=ctype, description=desc)
        db.add(c)
        courses[code] = c
    for code, title, sem, credits, prog, dept in [
        ("EC201", "Digital Electronics", 3, 4, "BTECH-ECE", "ECE"), ("EC301", "VLSI Design", 5, 4, "BTECH-ECE", "ECE"),
        ("ME201", "Thermodynamics", 3, 4, "BTECH-ME", "ME"), ("MB101", "Principles of Management", 1, 3, "MBA", "SOM"),
        ("MB205", "Financial Management", 2, 3, "MBA", "SOM"),
    ]:
        c = m.Course(code=code, title=title, program_id=progs[prog].id, department_id=depts[dept].id, semester=sem,
                     credits=credits, course_type="Core")
        db.add(c)
        courses[code] = c
    db.flush()

    teacher = {"CS101": "Prof. Meera Iyer", "CS201": "Prof. Meera Iyer", "CS203": "Dr. Arjun Patel",
               "CS301": "Dr. Rohan Sharma", "CS303": "Dr. Karan Malhotra", "CS305": "Dr. Arjun Patel",
               "CS401": "Dr. Ananya Rao", "CS403": "Prof. Sneha Joshi", "MA101": "Dr. Rakesh Verma",
               "EC201": "Prof. Nisha Gupta", "EC301": "Dr. Vikram Mehta", "ME201": "Dr. Sanjay Kulkarni",
               "MB101": "Prof. Aditya Bose", "MB205": "Dr. Priya Nair"}
    for code, c in courses.items():
        teacher_id = fac[teacher[code]].id if code in teacher else None
        if c.course_type == "Project":
            db.add(m.Subject(course_id=c.id, code=f"{code}-P", name=c.title, component="Project", credits=c.credits, weekly_hours=8))
            continue
        lab = code.startswith("CS") and c.credits == 4
        db.add(m.Subject(course_id=c.id, code=f"{code}-T", name=f"{c.title} (Theory)", component="Theory",
                         credits=c.credits - (1 if lab else 0), weekly_hours=3, faculty_id=teacher_id))
        if lab:
            db.add(m.Subject(course_id=c.id, code=f"{code}-L", name=f"{c.title} Lab", component="Lab",
                             credits=1, weekly_hours=2, faculty_id=teacher_id))

    refs = {"CS301": "Silberschatz, Korth & Sudarshan – Database System Concepts; Elmasri & Navathe – Fundamentals of Database Systems",
            "CS201": "Cormen et al. – Introduction to Algorithms; Lipschutz – Data Structures (Schaum's Outline)",
            "CS401": "Tom Mitchell – Machine Learning; Aurélien Géron – Hands-On Machine Learning"}
    for code, units in SYLLABUS.items():
        for unit, title, topics, hours in units:
            db.add(m.Syllabus(course_id=courses[code].id, unit_number=unit, title=title, topics=topics, hours=hours,
                              reference_books=refs[code]))

    fee_table = {"BTECH-CSE": 165000, "BTECH-AIML": 175000, "MTECH-CS": 120000, "BTECH-ECE": 150000,
                 "BTECH-ME": 140000, "MBA": 210000, "BBA": 95000, "PHD-CS": 80000}
    for code, tuition in fee_table.items():
        for year in range(1, progs[code].duration_years + 1):
            db.add(m.FeeStructure(program_id=progs[code].id, academic_year="2025-26", year_of_study=year,
                                  tuition_fee=Decimal(tuition), hostel_fee=Decimal(95000), exam_fee=Decimal(6000),
                                  other_fee=Decimal(12000 if year == 1 else 5000),
                                  notes=DEMO + ("Includes one-time admission and caution deposit." if year == 1 else "Hostel fee applies only to hostel residents.")))

    for title, cat, desc, loc, timings in LIBRARY:
        db.add(m.LibraryResource(title=title, category=cat, description=desc, location=loc, timings=timings))
    for name, cat, desc, loc, timings, contact, cap in FACILITIES:
        db.add(m.CampusFacility(name=name, category=cat, description=desc, location=loc, timings=timings, contact=contact, capacity=cap))
    for name, ftype, desc, loc, timings, phone, doctor, emergency in MEDICAL:
        db.add(m.MedicalFacility(name=name, facility_type=ftype, description=desc, location=loc, timings=timings,
                                 contact_phone=phone, doctor_name=doctor, is_emergency=emergency))
    for name, desig, office, phone, email, hours, emergency in CONTACTS:
        db.add(m.ImportantContact(name=name, designation=desig, office=office, phone=phone, email=email,
                                  available_hours=hours, is_emergency=emergency))
    now = datetime.utcnow()
    for i, (title, content, cat, prio) in enumerate(ANNOUNCEMENTS):
        db.add(m.Announcement(title=title, content=content, category=cat, priority=prio, created_by=admin.id,
                              created_at=now - timedelta(days=i * 2), updated_at=now - timedelta(days=i * 2)))

    student_role = db.scalar(select(m.Role).where(m.Role.name == "student"))
    for name, email, enr, dept, prog, year in STUDENTS:
        u = m.User(email=email, full_name=name, password_hash=hash_password("Student@123"), role_id=student_role.id)
        u.student = m.Student(enrollment_no=enr, department_id=depts[dept].id, program_id=progs[prog].id, year_of_study=year)
        db.add(u)

    db.add(m.ActivityLog(user_id=admin.id, action="seed", entity="System", summary="Loaded demonstration dataset"))
    db.commit()
    print("Demo data loaded.")


if __name__ == "__main__":
    if "--reset" in sys.argv:
        Base.metadata.drop_all(bind=engine)
    create_tables()
    with SessionLocal() as session:
        seed(session)
