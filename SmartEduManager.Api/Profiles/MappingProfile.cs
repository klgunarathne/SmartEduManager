using AutoMapper;
using SmartEduManager.Api.DTOs;
using SmartEduManager.Api.Models;

namespace SmartEduManager.Api.Profiles;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User mapping
        CreateMap<ApplicationUser, UserDto>();
        CreateMap<RegisterDto, ApplicationUser>();

        // District mapping
        CreateMap<District, DistrictDto>();
        CreateMap<CreateDistrictDto, District>();
        CreateMap<UpdateDistrictDto, District>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Center mapping
        CreateMap<Center, CenterDto>()
            .ForMember(dest => dest.DistrictName, opt => opt.MapFrom(src => src.District.DistrictName));
        CreateMap<CreateCenterDto, Center>();
        CreateMap<UpdateCenterDto, Center>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Course mapping
        CreateMap<Course, CourseDto>()
            .ForMember(dest => dest.CenterName, opt => opt.MapFrom(src => src.Center.CenterName))
            .ForMember(dest => dest.InstructorIds, opt => opt.MapFrom(src => src.CourseInstructors.Select(ci => ci.InstructorId).ToList()))
            .ForMember(dest => dest.InstructorNames, opt => opt.MapFrom(src => src.CourseInstructors.Select(ci => ci.Instructor.FullName).ToList()))
            .ForMember(dest => dest.BatchIds, opt => opt.MapFrom(src => src.Batches.Select(b => b.BatchId).ToList()))
            .ForMember(dest => dest.BatchCodes, opt => opt.MapFrom(src => src.Batches.Select(b => b.BatchCode).ToList()))
            .ForMember(dest => dest.HasInstructors, opt => opt.MapFrom(src => src.CourseInstructors.Any()))
            .ForMember(dest => dest.HasBatches, opt => opt.MapFrom(src => src.Batches.Any()));
        CreateMap<CreateCourseDto, Course>();
        CreateMap<UpdateCourseDto, Course>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Instructor mapping
        CreateMap<Instructor, InstructorDto>();
        CreateMap<CreateInstructorDto, Instructor>();
        CreateMap<UpdateInstructorDto, Instructor>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // CourseInstructor mapping
        CreateMap<CourseInstructor, CourseInstructorDto>()
            .ForMember(dest => dest.CourseName, opt => opt.MapFrom(src => src.Course.CourseName))
            .ForMember(dest => dest.InstructorName, opt => opt.MapFrom(src => src.Instructor.FullName));
        CreateMap<CreateCourseInstructorDto, CourseInstructor>();
        CreateMap<UpdateCourseInstructorDto, CourseInstructor>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Batch mapping
        CreateMap<Batch, BatchDto>()
            .ForMember(dest => dest.CourseName, opt => opt.MapFrom(src => src.Course.CourseName));
        CreateMap<CreateBatchDto, Batch>();
        CreateMap<UpdateBatchDto, Batch>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Student mapping
        CreateMap<Student, StudentDto>()
            .ForMember(dest => dest.BatchCode, opt => opt.MapFrom(src => src.Batch.BatchCode));
        CreateMap<CreateStudentDto, Student>();
        CreateMap<UpdateStudentDto, Student>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // NCS mapping
        CreateMap<NCS, NCSDto>()
            .ForMember(dest => dest.CourseName, opt => opt.MapFrom(src => src.Course.CourseName));
        CreateMap<CreateNCSDto, NCS>();
        CreateMap<UpdateNCSDto, NCS>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Modules mapping
        CreateMap<Models.Modules, ModulesDto>();
        CreateMap<CreateModulesDto, Models.Modules>();
        CreateMap<UpdateModulesDto, Models.Modules>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // ModuleTask mapping
        CreateMap<ModuleTask, ModuleTaskDto>()
            .ForMember(dest => dest.ModuleNo, opt => opt.MapFrom(src => src.Module.ModuleNo))
            .ForMember(dest => dest.OriginalAssessmentDate, opt => opt.MapFrom(src => src.OriginalAssessmentDate.HasValue ? src.OriginalAssessmentDate.Value.ToString("yyyy-MM-dd") : null));
        CreateMap<CreateModuleTaskDto, ModuleTask>();
        CreateMap<UpdateModuleTaskDto, ModuleTask>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Continuous Assessments
        CreateMap<ContinuousAssessment, ContinuousAssessmentDto>()
            .ForMember(dest => dest.StudentName, opt => opt.MapFrom(src => $"{src.Student.NameWithInitials}"))
            .ForMember(dest => dest.ModuleTaskName, opt => opt.MapFrom(src => src.ModuleTask.TaskName))
            .ForMember(dest => dest.ModuleName, opt => opt.MapFrom(src => src.ModuleTask.Module.ModuleName));
        CreateMap<CreateContinuousAssessmentDto, ContinuousAssessment>();
        CreateMap<UpdateContinuousAssessmentDto, ContinuousAssessment>();

        // Assignment mapping
        CreateMap<Assignment, AssignmentDto>();
        CreateMap<CreateAssignmentDto, Assignment>();
        CreateMap<UpdateAssignmentDto, Assignment>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // AssignmentMarks mapping
        CreateMap<AssignmentMarks, AssignmentMarksDto>()
            .ForMember(dest => dest.AssignmentName, opt => opt.MapFrom(src => src.Assignment.AssignmentName))
            .ForMember(dest => dest.StudentName, opt => opt.MapFrom(src => $"{src.Student.NameWithInitials}"))
            .ForMember(dest => dest.CoveringModule, opt => opt.MapFrom(src => src.Assignment.CoveringModule));
        CreateMap<CreateAssignmentMarksDto, AssignmentMarks>();
        CreateMap<UpdateAssignmentMarksDto, AssignmentMarks>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

// Attendance mapping
         CreateMap<Attendance, AttendanceDto>()
             .ForMember(dest => dest.StudentName, opt => opt.MapFrom(src => src.Student.NameWithInitials))
             .ForMember(dest => dest.MISNo, opt => opt.MapFrom(src => src.Student.MISNo))
             .ForMember(dest => dest.BatchCode, opt => opt.MapFrom(src => src.Batch.BatchCode));
         CreateMap<CreateAttendanceDto, Attendance>();
         CreateMap<UpdateAttendanceDto, Attendance>()
             .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

         // Question Category mapping
         CreateMap<QuestionCategory, QuestionCategoryDto>()
             .ForMember(dest => dest.QuestionCount, opt => opt.MapFrom(src => src.Questions.Count));
         CreateMap<CreateQuestionCategoryDto, QuestionCategory>();
         CreateMap<UpdateQuestionCategoryDto, QuestionCategory>()
             .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

         // Question mapping
         CreateMap<Question, QuestionDto>()
             .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString().ToLower()))
             .ForMember(dest => dest.Difficulty, opt => opt.MapFrom(src => src.Difficulty.ToString().ToLower()))
             .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category.Name))
             .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt.ToString("yyyy-MM-dd")))
             .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => src.UpdatedAt.ToString("yyyy-MM-dd")))
             .ForMember(dest => dest.Options, opt => opt.MapFrom(src => string.IsNullOrEmpty(src.Options) ? null : src.Options.Split('|', StringSplitOptions.RemoveEmptyEntries)));
            CreateMap<CreateQuestionDto, Question>()
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => Enum.Parse<QuestionType>(src.Type, true)))
                .ForMember(dest => dest.Difficulty, opt => opt.MapFrom(src => Enum.Parse<DifficultyLevel>(src.Difficulty, true)))
                .ForMember(dest => dest.Options, opt => opt.MapFrom(src => src.Options != null ? string.Join("|", src.Options) : null));
            CreateMap<UpdateQuestionDto, Question>()
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => Enum.Parse<QuestionType>(src.Type, true)))
                .ForMember(dest => dest.Difficulty, opt => opt.MapFrom(src => Enum.Parse<DifficultyLevel>(src.Difficulty, true)))
                .ForMember(dest => dest.Options, opt => opt.MapFrom(src => src.Options != null ? string.Join("|", src.Options) : null));

// Exam mapping
           CreateMap<Exam, ExamDto>()
               .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : "Uncategorized"))
               .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt.ToString("yyyy-MM-dd")))
               .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString().ToLowerInvariant()));
           CreateMap<CreateExamDto, Exam>();

// ExamQuestion mapping
           CreateMap<ExamQuestion, ExamQuestionDto>()
               .ForMember(dest => dest.Question, opt => opt.MapFrom(src => src.Question));
       }
 }