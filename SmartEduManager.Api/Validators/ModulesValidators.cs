using FluentValidation;
using SmartEduManager.Api.DTOs;

namespace SmartEduManager.Api.Validators;

public class CreateModulesDtoValidator : AbstractValidator<CreateModulesDto>
{
    public CreateModulesDtoValidator()
    {
        RuleFor(x => x.ModuleNo)
            .NotEmpty().WithMessage("Module number is required")
            .MaximumLength(50).WithMessage("Module number must be less than 50 characters");

        RuleFor(x => x.ModuleName)
            .NotEmpty().WithMessage("Module name is required")
            .MaximumLength(200).WithMessage("Module name must be less than 200 characters");

        RuleFor(x => x.TheoryHours)
            .GreaterThanOrEqualTo(0).WithMessage("Theory hours must be greater than or equal to 0");

        RuleFor(x => x.PracticalHours)
            .GreaterThanOrEqualTo(0).WithMessage("Practical hours must be greater than or equal to 0");

        RuleFor(x => x.NCSId)
            .NotEmpty().WithMessage("NCS is required")
            .GreaterThan(0).WithMessage("NCS ID must be greater than 0");
    }
}

public class UpdateModulesDtoValidator : AbstractValidator<UpdateModulesDto>
{
    public UpdateModulesDtoValidator()
    {
        RuleFor(x => x.ModuleNo)
            .MaximumLength(50).WithMessage("Module number must be less than 50 characters")
            .When(x => !string.IsNullOrEmpty(x.ModuleNo));

        RuleFor(x => x.ModuleName)
            .MaximumLength(200).WithMessage("Module name must be less than 200 characters")
            .When(x => !string.IsNullOrEmpty(x.ModuleName));

        RuleFor(x => x.TheoryHours)
            .GreaterThanOrEqualTo(0).WithMessage("Theory hours must be greater than or equal to 0")
            .When(x => x.TheoryHours.HasValue);

        RuleFor(x => x.PracticalHours)
            .GreaterThanOrEqualTo(0).WithMessage("Practical hours must be greater than or equal to 0")
            .When(x => x.PracticalHours.HasValue);

        RuleFor(x => x.NCSId)
            .GreaterThan(0).WithMessage("NCS ID must be greater than 0")
            .When(x => x.NCSId.HasValue);
    }
}
