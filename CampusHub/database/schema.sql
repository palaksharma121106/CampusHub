-- CampusHub MySQL schema (MySQL 8.0, utf8mb4).
-- Generated from the SQLAlchemy models; the same schema is created by Alembic: `alembic upgrade head`.
-- Usage: mysql -u campushub -p campushub < database/schema.sql

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `academic_programs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `level` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_id` int NOT NULL,
  `duration_years` int NOT NULL,
  `total_seats` int DEFAULT NULL,
  `eligibility` text COLLATE utf8mb4_unicode_ci,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `ix_academic_programs_department_id` (`department_id`),
  KEY `ix_academic_programs_level` (`level`),
  CONSTRAINT `academic_programs_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int DEFAULT NULL,
  `summary` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_activity_logs_created_at` (`created_at`),
  KEY `ix_activity_logs_user_id` (`user_id`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_published` tinyint(1) NOT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `ix_announcements_category` (`category`),
  KEY `ix_announcements_is_published` (`is_published`),
  CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `campus_facilities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `location` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timings` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_campus_facilities_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `chat_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `role` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sources` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_chat_messages_session_id` (`session_id`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `chat_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `chat_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_chat_sessions_user_id` (`user_id`),
  CONSTRAINT `chat_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `courses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `program_id` int NOT NULL,
  `department_id` int NOT NULL,
  `semester` int NOT NULL,
  `credits` int NOT NULL,
  `course_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `ix_courses_department_id` (`department_id`),
  KEY `ix_courses_program_id` (`program_id`),
  KEY `ix_courses_semester` (`semester`),
  CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `courses_ibfk_2` FOREIGN KEY (`program_id`) REFERENCES `academic_programs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `hod_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `document_chunks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `document_id` int NOT NULL,
  `chunk_index` int NOT NULL,
  `page_number` int DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_document_chunks_document_id` (`document_id`),
  CONSTRAINT `document_chunks_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `uploaded_documents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `faculty` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `designation` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_id` int NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qualification` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specialization` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `office` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `experience_years` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `ix_faculty_department_id` (`department_id`),
  KEY `ix_faculty_name` (`name`),
  CONSTRAINT `faculty_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `fee_structures` (
  `id` int NOT NULL AUTO_INCREMENT,
  `program_id` int NOT NULL,
  `academic_year` varchar(9) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year_of_study` int NOT NULL,
  `tuition_fee` decimal(10,2) NOT NULL,
  `hostel_fee` decimal(10,2) NOT NULL,
  `exam_fee` decimal(10,2) NOT NULL,
  `other_fee` decimal(10,2) NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fee_program_year` (`program_id`,`academic_year`,`year_of_study`),
  KEY `ix_fee_structures_program_id` (`program_id`),
  CONSTRAINT `fee_structures_ibfk_1` FOREIGN KEY (`program_id`) REFERENCES `academic_programs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `important_contacts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `designation` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `office` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `available_hours` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_emergency` tinyint(1) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_important_contacts_office` (`office`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `library_resources` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `location` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timings` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_library_resources_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `medical_facilities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `facility_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `location` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timings` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `doctor_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_emergency` tinyint(1) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_medical_facilities_facility_type` (`facility_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `query_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `query_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `input_mode` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `answered` tinyint(1) NOT NULL,
  `source_count` int NOT NULL,
  `generator` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `response_time_ms` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_query_logs_created_at` (`created_at`),
  KEY `ix_query_logs_user_id` (`user_id`),
  CONSTRAINT `query_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `enrollment_no` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_id` int DEFAULT NULL,
  `program_id` int DEFAULT NULL,
  `year_of_study` int NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `ix_students_enrollment_no` (`enrollment_no`),
  KEY `ix_students_department_id` (`department_id`),
  KEY `ix_students_program_id` (`program_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `students_ibfk_2` FOREIGN KEY (`program_id`) REFERENCES `academic_programs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `students_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `code` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `component` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `credits` int NOT NULL,
  `weekly_hours` int DEFAULT NULL,
  `faculty_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `ix_subjects_course_id` (`course_id`),
  KEY `ix_subjects_faculty_id` (`faculty_id`),
  CONSTRAINT `subjects_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subjects_ibfk_2` FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `syllabus` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `unit_number` int NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `topics` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `hours` int DEFAULT NULL,
  `reference_books` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_syllabus_course_unit` (`course_id`,`unit_number`),
  KEY `ix_syllabus_course_id` (`course_id`),
  CONSTRAINT `syllabus_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `uploaded_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stored_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint NOT NULL,
  `content_sha256` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `page_count` int DEFAULT NULL,
  `chunk_count` int NOT NULL,
  `is_verified` tinyint(1) NOT NULL,
  `indexed_at` datetime DEFAULT NULL,
  `uploaded_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stored_filename` (`stored_filename`),
  UNIQUE KEY `uq_uploaded_documents_content_sha256` (`content_sha256`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `ix_uploaded_documents_category` (`category`),
  KEY `ix_uploaded_documents_status` (`status`),
  CONSTRAINT `uploaded_documents_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` int NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `token_version` int NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_users_email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



SET FOREIGN_KEY_CHECKS = 1;
