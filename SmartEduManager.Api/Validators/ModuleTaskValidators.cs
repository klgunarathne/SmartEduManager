using FluentValidation;
using SmartEduManager.Api.DTOs;

namespace SmartEduManager.Api.Validators;

public class CreateModuleTaskDtoValidator : AbstractValidator<CreateModuleTaskDto>
{
    public CreateModuleTaskDtoValidator()
    {
        RuleFor(x => x.TaskNo)
            .NotEmpty().WithMessage("Task number is required")
            .MaximumLength(50).WithMessage("Task number must be less than 50 characters");

        RuleFor(x => x.TaskName)
            .NotEmpty().WithMessage("Task name is required")
            .MaximumLength(200).WithMessage("Task name must be less than 200 characters");

        RuleFor(x => x.ModuleId)
            .NotEmpty().WithMessage("Module is required")
            .GreaterThan(0).WithMessage("Module ID must be greater than 0");
    }
}

public class UpdateModuleTaskDtoValidator : AbstractValidator<UpdateModuleTaskDto>
{
    public UpdateModuleTaskDtoValidator()
    {
        RuleFor(x => x.TaskNo)
            .MaximumLength(50).WithMessage("Task number must be less than 50 characters")
            .When(x => !string.IsNullOrEmpty(x.TaskNo));

        RuleFor(x => x.TaskName)
            .MaximumLength(200).WithMessage("Task name must be less than 200 characters")
            .When(x => !string.IsNullOrEmpty(x.TaskName));

        RuleFor(x => x.ModuleId)
            .GreaterThan(0).WithMessage("Module ID must be greater than 0")
            .When(x => x.ModuleId.HasValue);
    }
}
