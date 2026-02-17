using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SmartEduManager.Api.Models
{
    public class ModuleTask
    {
        public int Id { get; set; }
        public string TaskNo { get; set; } = string.Empty;
        public string TaskName { get; set; } = string.Empty;
    }
}