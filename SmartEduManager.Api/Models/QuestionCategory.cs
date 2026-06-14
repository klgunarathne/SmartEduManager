using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SmartEduManager.Api.Models
{
    public class QuestionCategory
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = "#6366f1";
        
        public ICollection<Question> Questions { get; set; } = [];
        public ICollection<Exam> Exams { get; set; } = [];
    }
}