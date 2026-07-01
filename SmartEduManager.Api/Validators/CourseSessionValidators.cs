using FluentValidation;
using SmartEduManager.Api.DTOs;

namespace SmartEduManager.Api.Validators;

public class CreateCourseSessionDtoValidator : AbstractValidator<CreateCourseSessionDto>
{
    public CreateCourseSessionDtoValidator()
    {
        RuleFor(x => x.Text)
            .NotEmpty().WithMessage("Session title is required")
            .MaximumLength(200).WithMessage("Title must be less than 200 characters");

        RuleFor(x => x.StartDateTime)
            .NotEmpty().WithMessage("Start date/time is required");

        RuleFor(x => x.EndDateTime)
            .NotEmpty().WithMessage("End date/time is required")
            .GreaterThan(x => x.StartDateTime).WithMessage("End date/time must be after start date/time");

        RuleFor(x => x.BatchId)
            .GreaterThan(0).WithMessage("Batch is required");

        RuleFor(x => x.SessionType)
            .MaximumLength(50).WithMessage("Session type must be less than 50 characters")
            .When(x => !string.IsNullOrEmpty(x.SessionType));

        RuleFor(x => x.Status)
            .MaximumLength(50).WithMessage("Status must be less than 50 characters")
            .When(x => !string.IsNullOrEmpty(x.Status));

        RuleForEach(x => x.Items)
            .SetValidator(new CreateSessionItemDtoValidator())
            .When(x => x.Items != null && x.Items.Any());
    }
}

public class UpdateCourseSessionDtoValidator : AbstractValidator<UpdateCourseSessionDto>
{
    public UpdateCourseSessionDtoValidator()
    {
        RuleFor(x => x.Text)
            .MaximumLength(200).WithMessage("Title must be less than 200 characters")
            .When(x => !string.IsNullOrEmpty(x.Text));

        RuleFor(x => x.EndDateTime)
            .GreaterThan(x => x.StartDateTime).WithMessage("End date/time must be after start date/time")
            .When(x => x.EndDateTime.HasValue && x.StartDateTime.HasValue);

        RuleFor(x => x.SessionType)
            .MaximumLength(50).WithMessage("Session type must be less than 50 characters")
            .When(x => !string.IsNullOrEmpty(x.SessionType));

        RuleFor(x => x.Status)
            .MaximumLength(50).WithMessage("Status must be less than 50 characters")
            .When(x => !string.IsNullOrEmpty(x.Status));

        RuleForEach(x => x.Items)
            .SetValidator(new CreateSessionItemDtoValidator())
            .When(x => x.Items != null && x.Items.Any());
    }
}

public class CreateSessionItemDtoValidator : AbstractValidator<CreateSessionItemDto>
{
    public CreateSessionItemDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Item title is required")
            .MaximumLength(200).WithMessage("Title must be less than 200 characters");

        RuleFor(x => x.ItemType)
            .NotEmpty().WithMessage("Item type is required")
            .MaximumLength(50).WithMessage("Item type must be less than 50 characters");
    }
}

public class ConflictCheckRequestDtoValidator : AbstractValidator<ConflictCheckRequestDto>
{
    public ConflictCheckRequestDtoValidator()
    {
        RuleFor(x => x.BatchId)
            .GreaterThan(0).WithMessage("Batch is required");

        RuleFor(x => x.StartDateTime)
            .NotEmpty().WithMessage("Start date/time is required");

        RuleFor(x => x.EndDateTime)
            .NotEmpty().WithMessage("End date/time is required")
            .GreaterThan(x => x.StartDateTime).WithMessage("End date/time must be after start date/time");
    }
}

public class GenerateTimetableRequestDtoValidator : AbstractValidator<GenerateTimetableRequestDto>
{
    public GenerateTimetableRequestDtoValidator()
    {
        RuleFor(x => x.BatchId)
            .GreaterThan(0).WithMessage("Batch is required");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Start date is required");

        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage("End date is required")
            .GreaterThan(x => x.StartDate).WithMessage("End date must be after start date");

        RuleForEach(x => x.Modules)
            .SetValidator(new GenerateTimetableModuleDtoValidator());
    }
}

public class GenerateTimetableModuleDtoValidator : AbstractValidator<GenerateTimetableModuleDto>
{
    public GenerateTimetableModuleDtoValidator()
    {
        RuleFor(x => x.ModuleId)
            .GreaterThan(0).WithMessage("Module ID must be greater than 0");

        RuleFor(x => x.ModuleName)
            .NotEmpty().WithMessage("Module name is required");

        RuleFor(x => x.SessionDurationMinutes)
            .GreaterThan(0).WithMessage("Session duration must be greater than 0");
    }
}
