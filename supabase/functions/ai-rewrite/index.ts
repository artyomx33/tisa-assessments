import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, styleGuide, studentName, provider, customApiKey } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build student name instruction if provided
    const studentNameInstruction = studentName 
      ? `\n\nThe student's name is: ${studentName}. Use their name naturally in your rewrite — typically once at the start or mid-sentence, then use pronouns (he/she/they) or implicit subjects for subsequent sentences. NEVER use placeholders like [Student Name] or [Student's Name].`
      : '';

    const systemPrompt = `You are a professional education report writer for TISA School.
Your job is to completely REWRITE the teacher's comment following the school's writing style.

${styleGuide ? `Writing Style Guide:\n${styleGuide}\n\n` : ''}
IMPORTANT Rules:
- Do NOT keep the original text - write a completely NEW version
- Convey the same meaning and observations but in polished, professional language
- Use encouraging, growth-oriented language
- Keep similar length to the original (don't make it much longer)
- Write in third person (e.g., "The student..." or use the student's name if provided)
- Be specific and constructive
- Avoid generic phrases - make it personal to the observation${studentNameInstruction}`;

    let apiUrl: string;
    let apiKey: string;
    let model: string;
    let headers: Record<string, string>;
    let body: Record<string, unknown>;

    // Determine which provider to use
    const selectedProvider = provider || 'lovable';

    if (selectedProvider === 'lovable' || !customApiKey) {
      // Use Lovable AI Gateway (default)
      apiKey = Deno.env.get('LOVABLE_API_KEY') || '';
      if (!apiKey) {
        throw new Error("LOVABLE_API_KEY is not configured");
      }
      apiUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
      model = 'google/gemini-2.5-flash';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      body = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please rewrite this teacher's comment:\n\n"${text}"` }
        ],
      };
    } else if (selectedProvider === 'openai' && customApiKey) {
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      model = 'gpt-4o-mini';
      headers = {
        'Authorization': `Bearer ${customApiKey}`,
        'Content-Type': 'application/json',
      };
      body = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please rewrite this teacher's comment:\n\n"${text}"` }
        ],
        max_tokens: 1000,
      };
    } else if (selectedProvider === 'google' && customApiKey) {
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${customApiKey}`;
      headers = {
        'Content-Type': 'application/json',
      };
      body = {
        contents: [{
          parts: [{ text: `${systemPrompt}\n\nPlease rewrite this teacher's comment:\n\n"${text}"` }]
        }]
      };
    } else if (selectedProvider === 'anthropic' && customApiKey) {
      apiUrl = 'https://api.anthropic.com/v1/messages';
      headers = {
        'x-api-key': customApiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      };
      body = {
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: `Please rewrite this teacher's comment:\n\n"${text}"` }
        ],
      };
    } else {
      throw new Error(`Invalid provider: ${selectedProvider}`);
    }

    console.log(`Using provider: ${selectedProvider}, API URL: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let rewrittenText: string;

    // Parse response based on provider
    if (selectedProvider === 'google' && customApiKey) {
      rewrittenText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (selectedProvider === 'anthropic') {
      rewrittenText = data.content?.[0]?.text || '';
    } else {
      // OpenAI format (used by Lovable AI and OpenAI)
      rewrittenText = data.choices?.[0]?.message?.content || '';
    }

    if (!rewrittenText) {
      throw new Error("No response from AI");
    }

    return new Response(JSON.stringify({ rewrittenText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-rewrite function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
