using Microsoft.AspNetCore.Http;
using System.IO;
using System.Text.RegularExpressions;

namespace SmartEduManager.Api.Helpers;

public class ImageUploadHelper
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp"
    };

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/gif", "image/webp"
    };

    private static readonly Regex SubFolderPattern = new("^[a-zA-Z0-9_-]+$", RegexOptions.Compiled);

    public async Task<string> UploadImageAsync(IFormFile file, string subFolder = "images")
    {
        if (file is null || file.Length == 0)
        {
            throw new InvalidOperationException("No file uploaded");
        }

        var normalizedSubFolder = NormalizeSubFolder(subFolder);
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!AllowedExtensions.Contains(fileExtension))
        {
            throw new InvalidOperationException("Invalid image file type");
        }

        if (!AllowedContentTypes.Contains(file.ContentType))
        {
            throw new InvalidOperationException("Invalid image content type");
        }

        const int maxFileSize = 5 * 1024 * 1024;
        if (file.Length > maxFileSize)
        {
            throw new InvalidOperationException("File size exceeds 5MB limit");
        }

        await using var inputStream = file.OpenReadStream();
        using var reader = new BinaryReader(inputStream);
        var header = reader.ReadBytes(12);

        if (!HasValidImageSignature(header, fileExtension))
        {
            throw new InvalidOperationException("Invalid image file signature");
        }

        var uploadsRoot = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads"));
        var uploadPath = Path.GetFullPath(Path.Combine(uploadsRoot, normalizedSubFolder));

        if (!IsPathInsideRoot(uploadPath, uploadsRoot))
        {
            throw new InvalidOperationException("Invalid upload path");
        }

        Directory.CreateDirectory(uploadPath);

        var fileName = $"{Guid.NewGuid():N}{fileExtension}";
        var filePath = Path.Combine(uploadPath, fileName);

        inputStream.Position = 0;
        await using (var outputStream = File.Create(filePath))
        {
            await inputStream.CopyToAsync(outputStream);
        }

        return $"/uploads/{normalizedSubFolder}/{fileName}";
    }

    public bool DeleteImage(string imagePath)
    {
        if (string.IsNullOrWhiteSpace(imagePath) || imagePath.StartsWith("http", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var relativePath = imagePath.Replace('\\', '/').TrimStart('/');
        if (relativePath.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase))
        {
            relativePath = relativePath["uploads/".Length..];
        }

        if (relativePath.Contains("..", StringComparison.Ordinal) || Path.GetExtension(relativePath).Length == 0)
        {
            return false;
        }

        var uploadsRoot = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads"));
        var absolutePath = Path.GetFullPath(Path.Combine(uploadsRoot, relativePath));

        if (!IsPathInsideRoot(absolutePath, uploadsRoot) || !File.Exists(absolutePath))
        {
            return false;
        }

        File.Delete(absolutePath);
        return true;
    }

    private static string NormalizeSubFolder(string subFolder)
    {
        var normalized = string.IsNullOrWhiteSpace(subFolder) ? "images" : subFolder.Trim();
        if (!SubFolderPattern.IsMatch(normalized))
        {
            throw new InvalidOperationException("Invalid upload folder");
        }

        return normalized;
    }

    private static bool HasValidImageSignature(byte[] header, string extension)
    {
        return extension is ".jpg" or ".jpeg"
            ? header.Length >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF
            : extension == ".png"
                ? header.Length >= 8 && header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47
                : extension == ".gif"
                    ? header.Length >= 6 && header[0] == 0x47 && header[1] == 0x49 && header[2] == 0x46
                    : extension == ".webp" && header.Length >= 12 && header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46 && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50;
    }

    private static bool IsPathInsideRoot(string path, string root)
    {
        var normalizedRoot = root.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        return path.Equals(normalizedRoot, StringComparison.OrdinalIgnoreCase)
            || path.StartsWith(normalizedRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)
            || path.StartsWith(normalizedRoot + Path.AltDirectorySeparatorChar, StringComparison.OrdinalIgnoreCase);
    }
}
