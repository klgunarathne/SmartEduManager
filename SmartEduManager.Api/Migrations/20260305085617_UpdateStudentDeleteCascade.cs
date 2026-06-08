using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartEduManager.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateStudentDeleteCascade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AssignmentMarks_Students_StudentId",
                table: "AssignmentMarks");

            migrationBuilder.DropForeignKey(
                name: "FK_ContinuousAssessments_ModuleTasks_ModuleTaskId",
                table: "ContinuousAssessments");

            migrationBuilder.DropForeignKey(
                name: "FK_ContinuousAssessments_Students_StudentId",
                table: "ContinuousAssessments");

            migrationBuilder.AddForeignKey(
                name: "FK_AssignmentMarks_Students_StudentId",
                table: "AssignmentMarks",
                column: "StudentId",
                principalTable: "Students",
                principalColumn: "StudentId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ContinuousAssessments_ModuleTasks_ModuleTaskId",
                table: "ContinuousAssessments",
                column: "ModuleTaskId",
                principalTable: "ModuleTasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ContinuousAssessments_Students_StudentId",
                table: "ContinuousAssessments",
                column: "StudentId",
                principalTable: "Students",
                principalColumn: "StudentId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AssignmentMarks_Students_StudentId",
                table: "AssignmentMarks");

            migrationBuilder.DropForeignKey(
                name: "FK_ContinuousAssessments_ModuleTasks_ModuleTaskId",
                table: "ContinuousAssessments");

            migrationBuilder.DropForeignKey(
                name: "FK_ContinuousAssessments_Students_StudentId",
                table: "ContinuousAssessments");

            migrationBuilder.AddForeignKey(
                name: "FK_AssignmentMarks_Students_StudentId",
                table: "AssignmentMarks",
                column: "StudentId",
                principalTable: "Students",
                principalColumn: "StudentId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ContinuousAssessments_ModuleTasks_ModuleTaskId",
                table: "ContinuousAssessments",
                column: "ModuleTaskId",
                principalTable: "ModuleTasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ContinuousAssessments_Students_StudentId",
                table: "ContinuousAssessments",
                column: "StudentId",
                principalTable: "Students",
                principalColumn: "StudentId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
