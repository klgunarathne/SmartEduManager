using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Threading.Tasks;

namespace SmartEduManager.Api.Helpers;

public class ImageUploadHelper
{
    private readonly IConfiguration _configuration;

    public ImageUploadHelper(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task<string> UploadImageAsync(IFormFile file, string subFolder = "images")
    {
        try
        {
            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var fileExtension = Path.GetExtension(file.FileName).ToLower();
            
            if (!Array.Exists(allowedExtensions, ext => ext == fileExtension))
            {
                throw new InvalidOperationException("Invalid image file type. Allowed types: jpg, jpeg, png, gif, webp");
            }

            // Validate file size (max 5MB)
            const int maxFileSize = 5 * 1024 * 1024; // 5MB
            if (file.Length > maxFileSize)
            {
                throw new InvalidOperationException("File size exceeds 5MB limit");
            }

            // Create unique filename
            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            
            // Get upload directory
            var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", subFolder);
            
            // Create directory if it doesn't exist
            if (!Directory.Exists(uploadPath))
            {
                Directory.CreateDirectory(uploadPath);
            }

            // Save file
            var filePath = Path.Combine(uploadPath, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return relative path for database storage
            return $"/uploads/{subFolder}/{fileName}";
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Error uploading image: {ex.Message}", ex);
        }
    }

    public bool DeleteImage(string imagePath)
    {
        try
        {
            if (string.IsNullOrEmpty(imagePath) || imagePath.StartsWith("http"))
            {
                return false;
            }

            // Convert relative path to absolute path
            var absolutePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", imagePath.TrimStart('/'));
            
            if (File.Exists(absolutePath))
            {
                File.Delete(absolutePath);
                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting image: {ex.Message}");
            return false;
        }
    }
}