namespace FlowSpeak.Api.Models.DTOs
{
    /// <summary>
    /// Accepts raw, unstructured human text from the frontend.
    /// The backend NLP engine will extract the intent from this.
    /// </summary>
    public class RawTextRequest
    {
        public string Text { get; set; } = string.Empty;
    }
}
