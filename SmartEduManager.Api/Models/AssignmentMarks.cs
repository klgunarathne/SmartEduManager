using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SmartEduManager.Api.Models
{
    public class AssignmentMarks
    {
        public int Id { get; set; }
        public int Marks { get; set; }
        public DateTime AssignmentDate { get; set; }
        
        public int AssignmentId { get; set; }
        public required Assignment Assignment { get; set; }

        public int StudentId { get; set; }
        public required Student Student { get; set; }
    }
}