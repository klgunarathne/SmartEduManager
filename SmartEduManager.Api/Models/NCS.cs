using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SmartEduManager.Api.Models
{
    public class NCS
    {
        public int Id { get; set; }
        public string Version { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public DateTime UpdatedDate { get; set; }

        public int CourseId { get; set; }
        public Course Course { get; set; } = null!;

        public ICollection<Modules> Modules { get; set; } = new List<Modules>();

    }
}