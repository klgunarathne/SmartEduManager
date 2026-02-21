using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SmartEduManager.Api.Models
{
    public class Assignment
    {
        public int Id { get; set; }
        public string AssignmentName { get; set; } = string.Empty;
        public string CoveringModule { get; set; } = string.Empty;

        public ICollection<AssignmentMarks> AssignmentMarks { get; set; } = [];
    }
}