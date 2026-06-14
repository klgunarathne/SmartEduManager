using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SmartEduManager.Api.Models
{
    public class ExamQuestion
    {
        public int Id { get; set; }
        public int Order { get; set; } = 0;

        // Navigation properties
        public int ExamId { get; set; }
        public Exam Exam { get; set; } = null!;
        
        public int QuestionId { get; set; }
        public Question Question { get; set; } = null!;
    }
}