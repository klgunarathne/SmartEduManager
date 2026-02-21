using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartEduManager.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCoveringModuleToAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CoveringModule",
                table: "Assignments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CoveringModule",
                table: "Assignments");
        }
    }
}
