using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartEduManager.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAttendanceTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ContinuousAssessments_Students_StudentId",
                table: "ContinuousAssessments");

            migrationBuilder.AddForeignKey(
                name: "FK_ContinuousAssessments_Students_StudentId",
                table: "ContinuousAssessments",
                column: "StudentId",
                principalTable: "Students",
                principalColumn: "StudentId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ContinuousAssessments_Students_StudentId",
                table: "ContinuousAssessments");

            migrationBuilder.AddForeignKey(
                name: "FK_ContinuousAssessments_Students_StudentId",
                table: "ContinuousAssessments",
                column: "StudentId",
                principalTable: "Students",
                principalColumn: "StudentId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
