using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartEduManager.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddContinuousAssessment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ContinuousAssessments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    ModuleTaskId = table.Column<int>(type: "int", nullable: false),
                    AssessmentMark = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AssessmentDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AssessorNotes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContinuousAssessments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContinuousAssessments_ModuleTasks_ModuleTaskId",
                        column: x => x.ModuleTaskId,
                        principalTable: "ModuleTasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ContinuousAssessments_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "StudentId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContinuousAssessments_ModuleTaskId",
                table: "ContinuousAssessments",
                column: "ModuleTaskId");

            migrationBuilder.CreateIndex(
                name: "IX_ContinuousAssessments_StudentId_ModuleTaskId",
                table: "ContinuousAssessments",
                columns: new[] { "StudentId", "ModuleTaskId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContinuousAssessments");
        }
    }
}
