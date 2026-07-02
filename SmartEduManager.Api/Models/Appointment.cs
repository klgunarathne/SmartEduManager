using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartEduManager.Api.Models
{
    public class Appointment
    {
        public int AppointmentId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Text { get; set; } = string.Empty;

        public string? Description { get; set; }

        public DateTime StartDateTime { get; set; }

        public DateTime EndDateTime { get; set; }

        public bool AllDay { get; set; }

        public string? RecurrenceRule { get; set; }

        public string? RecurrenceException { get; set; }

        public string? SessionType { get; set; } = "Theory";

        public string? Status { get; set; } = "Scheduled";

        public bool IsPublished { get; set; } = false;

        public string? Color { get; set; }

        public int? CourseId { get; set; }
        public Course? Course { get; set; }

        public int? BatchId { get; set; }
        public Batch? Batch { get; set; }

        public int? InstructorId { get; set; }
        public Instructor? Instructor { get; set; }

        public int? CenterId { get; set; }
        public Center? Center { get; set; }

        public int? ModuleId { get; set; }
        public Modules? Module { get; set; }

        public int? ColorId { get; set; }

        public string? TaskNo { get; set; }

        public string? TaskName { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public ICollection<SessionItem> Items { get; set; } = new List<SessionItem>();
    }

    public class SessionItem
    {
        [Key]
        public int ItemId { get; set; }

        [Required]
        public int AppointmentId { get; set; }
        public Appointment? Appointment { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        [MaxLength(50)]
        public string ItemType { get; set; } = "Task";

        public bool IsCompleted { get; set; } = false;

        public DateTime? DueDateTime { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
