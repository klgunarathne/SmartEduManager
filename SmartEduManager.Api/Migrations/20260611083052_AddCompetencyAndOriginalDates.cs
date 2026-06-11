using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartEduManager.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCompetencyAndOriginalDates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "OriginalAssessmentDate",
                table: "ModuleTasks",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CompetencyDate",
                table: "ContinuousAssessments",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OriginalAssessmentDate",
                table: "ModuleTasks");

            migrationBuilder.DropColumn(
                name: "CompetencyDate",
                table: "ContinuousAssessments");
        }
    }
}
