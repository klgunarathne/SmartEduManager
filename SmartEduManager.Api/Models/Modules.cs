using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SmartEduManager.Api.Models
{
    public class Modules
    {
        public int Id { get; set; }
        public string ModuleNo { get; set; } = string.Empty;
        public string ModuleName { get; set; } = string.Empty;
        public int TheoryHours { get; set; } = 0;
        public int PracticalHours { get; set; } = 0;

        public int NCSId { get; set; }
        public NCS NCS { get; set; } = null!;

        public ICollection<ModuleTask> Tasks { get; set; } = new List<ModuleTask>();
    }
}