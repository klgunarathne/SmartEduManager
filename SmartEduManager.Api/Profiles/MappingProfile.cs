using AutoMapper;
using SmartEduManager.Api.DTOs;
using SmartEduManager.Api.Helpers;
using SmartEduManager.Api.Models;
using System.Text.Json;

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
            .ForMember(dest => dest.HasBatches, opt => opt.MapFrom(src => src.Batches.Any()))
            .ForMember(dest => dest.NCS, opt => opt.MapFrom(src => src.NCS.Select(n => new CourseNCDto { Id = n.Id, Version = n.Version, Name = n.Name, UpdatedDate = n.UpdatedDate }).ToList()));
        CreateMap<CreateCourseDto, Course>();
        CreateMap<UpdateCourseDto, Course>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Instructor mapping
        CreateMap<Instructor, InstructorDto>()
            .ForMember(dest => dest.CenterIds, opt => opt.MapFrom(src => src.CourseInstructors.Select(ci => ci.Course.CenterId).Distinct().ToList()))
            .ForMember(dest => dest.CenterNames, opt => opt.MapFrom(src => src.CourseInstructors.Select(ci => ci.Course.Center.CenterName).Distinct().ToList()))
            .ForMember(dest => dest.CourseIds, opt => opt.MapFrom(src => src.CourseInstructors.Select(ci => ci.CourseId).ToList()))
            .ForMember(dest => dest.CourseNames, opt => opt.MapFrom(src => src.CourseInstructors.Select(ci => ci.Course.CourseName).ToList()));
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
               .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : "Uncategorized"))
               .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt.ToString("yyyy-MM-dd")))
               .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => src.UpdatedAt.ToString("yyyy-MM-dd")))
               .ForMember(dest => dest.Options, opt => opt.MapFrom(src => string.IsNullOrEmpty(src.Options) ? null : JsonSerializer.Deserialize<string[]>(src.Options)))
               .ForMember(dest => dest.Required, opt => opt.MapFrom(src => src.Required));
             CreateMap<CreateQuestionDto, Question>()
                 .ForMember(dest => dest.Type, opt => opt.MapFrom(src => EnumHelper.ParseQuestionType(src.Type)))
                 .ForMember(dest => dest.Difficulty, opt => opt.MapFrom(src => EnumHelper.ParseDifficultyLevel(src.Difficulty)))
                 .ForMember(dest => dest.Options, opt => opt.MapFrom(src => src.Options != null ? JsonSerializer.Serialize(src.Options) : null))
                 .ForMember(dest => dest.Required, opt => opt.MapFrom(src => src.Required));
             CreateMap<UpdateQuestionDto, Question>()
                 .ForMember(dest => dest.Type, opt => opt.MapFrom(src => EnumHelper.ParseQuestionType(src.Type)))
                 .ForMember(dest => dest.Difficulty, opt => opt.MapFrom(src => EnumHelper.ParseDifficultyLevel(src.Difficulty)))
                 .ForMember(dest => dest.Options, opt => opt.MapFrom(src => src.Options != null ? JsonSerializer.Serialize(src.Options) : null))
                 .ForMember(dest => dest.Required, opt => opt.MapFrom(src => src.Required));

// Exam mapping
            CreateMap<Exam, ExamDto>()
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : "Uncategorized"))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt.ToString("yyyy-MM-dd")))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString().ToLowerInvariant()))
                .ForMember(dest => dest.QuestionCount, opt => opt.MapFrom(src => src.ExamQuestions != null ? src.ExamQuestions.Count : 0))
                .ForMember(dest => dest.TotalMarks, opt => opt.MapFrom(src => src.ExamQuestions != null ? src.ExamQuestions.Sum(eq => eq.Question != null ? eq.Question.Marks : 0) : 0))
                .ForMember(dest => dest.Questions, opt => opt.MapFrom(src => src.ExamQuestions));

            CreateMap<CreateExamDto, Exam>();
            CreateMap<UpdateExamDto, Exam>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // ExamQuestion mapping
            CreateMap<ExamQuestion, ExamQuestionDto>()
                .ForMember(dest => dest.Question, opt => opt.MapFrom(src => src.Question));

            // ExamAttempt mapping
            CreateMap<ExamAttempt, ExamAttemptDto>()
                .ForMember(dest => dest.Exam, opt => opt.MapFrom(src => src.Exam));

            // ExamAnswer mapping
            CreateMap<ExamAnswer, ExamAnswerDto>();
            CreateMap<ExamAnswer, ExamAnswerResultDto>()
                .ForMember(dest => dest.QuestionContent, opt => opt.Ignore())
                .ForMember(dest => dest.CorrectAnswer, opt => opt.Ignore())
                .ForMember(dest => dest.TotalMarks, opt => opt.Ignore());

             // ExamResult mapping
             CreateMap<ExamAttempt, ExamResultDto>()
                 .ForMember(dest => dest.ExamTitle, opt => opt.MapFrom(src => src.Exam != null ? src.Exam.Title : string.Empty))
                 .ForMember(dest => dest.Percentage, opt => opt.MapFrom(src => src.TotalMarks > 0 ? (double)src.Score / src.TotalMarks * 100 : 0));

             // Appointment (CourseSession) mapping
             CreateMap<Appointment, CourseSessionDto>()
                 .ForMember(dest => dest.AppointmentId, opt => opt.MapFrom(src => src.AppointmentId))
                 .ForMember(dest => dest.Text, opt => opt.MapFrom(src => src.Text))
                 .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description))
                 .ForMember(dest => dest.StartDateTime, opt => opt.MapFrom(src => src.StartDateTime))
                 .ForMember(dest => dest.EndDateTime, opt => opt.MapFrom(src => src.EndDateTime))
                 .ForMember(dest => dest.AllDay, opt => opt.MapFrom(src => src.AllDay))
                 .ForMember(dest => dest.RecurrenceRule, opt => opt.MapFrom(src => src.RecurrenceRule))
                 .ForMember(dest => dest.RecurrenceException, opt => opt.MapFrom(src => src.RecurrenceException))
                 .ForMember(dest => dest.SessionType, opt => opt.MapFrom(src => src.SessionType))
                 .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status))
                 .ForMember(dest => dest.IsPublished, opt => opt.MapFrom(src => src.IsPublished))
                 .ForMember(dest => dest.Color, opt => opt.MapFrom(src => src.Color))
                 .ForMember(dest => dest.CourseName, opt => opt.MapFrom(src => src.Course != null ? src.Course.CourseName : null))
                 .ForMember(dest => dest.BatchCode, opt => opt.MapFrom(src => src.Batch != null ? src.Batch.BatchCode : null))
                 .ForMember(dest => dest.InstructorName, opt => opt.MapFrom(src => src.Instructor != null ? src.Instructor.FullName : null))
                 .ForMember(dest => dest.CenterName, opt => opt.MapFrom(src => src.Center != null ? src.Center.CenterName : null))
                 .ForMember(dest => dest.ModuleName, opt => opt.MapFrom(src => src.Module != null ? src.Module.ModuleName : null))
                  .ForMember(dest => dest.TaskNo, opt => opt.MapFrom(src => src.TaskNo))
                  .ForMember(dest => dest.TaskName, opt => opt.MapFrom(src => src.TaskName));

             CreateMap<CreateCourseSessionDto, Appointment>()
                 .ForMember(dest => dest.AppointmentId, opt => opt.Ignore())
                 .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                 .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                 .ForMember(dest => dest.Items, opt => opt.Ignore());

              CreateMap<UpdateCourseSessionDto, Appointment>()
                  .ForMember(dest => dest.AppointmentId, opt => opt.Ignore())
                  .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                  .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                  .ForMember(dest => dest.Items, opt => opt.Ignore());

             CreateMap<SessionItem, SessionItemDto>();
             CreateMap<CreateSessionItemDto, SessionItem>();
         }
     }