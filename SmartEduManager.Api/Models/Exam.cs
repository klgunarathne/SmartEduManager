using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SmartEduManager.Api.Models
{
    public class Exam
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int Duration { get; set; } // in minutes
        public bool IsActive { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public int CategoryId { get; set; }
        public QuestionCategory Category { get; set; } = null!;
        
        public ICollection<ExamQuestion> ExamQuestions { get; set; } = [];
    }
}