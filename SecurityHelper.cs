using System.Security.Cryptography;
using System.Text;

namespace FlowSpeak.Api.Security
{
    public static class SecurityHelper
    {
        /// <summary>
        /// Computes the SHA256 hash of a given string.
        /// </summary>
        /// <param name="rawData">The string to hash.</param>
        /// <returns>The SHA256 hash as a hexadecimal string.</returns>
        public static string ComputeSha256Hash(string rawData)
        {
            if (string.IsNullOrEmpty(rawData))
            {
                return string.Empty; // Or throw an exception, depending on desired behavior
            }

            using (SHA256 sha256Hash = SHA256.Create())
            {
                byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(rawData));
                StringBuilder builder = new StringBuilder();
                for (int i = 0; i < bytes.Length; i++)
                {
                    builder.Append(bytes[i].ToString("x2")); // "x2" formats as two lowercase hexadecimal digits
                }
                return builder.ToString();
            }
        }
    }
}