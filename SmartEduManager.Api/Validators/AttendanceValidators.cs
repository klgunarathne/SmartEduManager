using FluentValidation;
using SmartEduManager.Api.DTOs;

namespace SmartEduManager.Api.Validators;

public class CreateAttendanceDtoValidator : AbstractValidator<CreateAttendanceDto>
{
    public CreateAttendanceDtoValidator()
    {
        RuleFor(x => x.StudentId)
            .GreaterThan(0).WithMessage("Student ID must be greater than 0");

        RuleFor(x => x.BatchId)
            .GreaterThan(0).WithMessage("Batch ID must be greater than 0");

        RuleFor(x => x.Date)
            .NotEmpty().WithMessage("Date is required");
    }
}