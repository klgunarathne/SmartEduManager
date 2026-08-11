using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartEduManager.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRequiredToQuestion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Required",
                table: "Questions",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Required",
                table: "Questions");
        }
    }
}
