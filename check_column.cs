using System;
using System.Data.SqlClient;

class Program
{
    static void Main()
    {
        var connString = "Server=localhost;Database=SmartEduManager;user id=sa;password=Dragon88;TrustServerCertificate=True;MultipleActiveResultSets=true";
        using var conn = new SqlConnection(connString);
        conn.Open();
        using var cmd = new SqlCommand("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Questions' AND COLUMN_NAME = 'ImageUrl'", conn);
        var result = cmd.ExecuteScalar();
        Console.WriteLine(result != null ? "Column exists" : "Column does not exist");
    }
}
