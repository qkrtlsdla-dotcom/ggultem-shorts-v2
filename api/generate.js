export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST 요청만 사용할 수 있습니다."
    });
  }

  try {
    const {
      productName = "",
      productInfo = "",
      referencePoint = "",
      tone = "빠른 꿀템형",
      duration = "25초"
    } = req.body || {};

    if (!productName.trim()) {
      return res.status(400).json({
        error: "상품명을 입력해주세요."
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY가 설정되지 않았습니다."
      });
    }

    const prompt = `
너는 한국 쇼핑 숏폼 전문 기획자다.

목표:
유튜브 쇼츠와 네이버 클립에 사용할
완전히 새로운 쇼핑 숏폼 기획안을 만든다.

상품명:
${productName}

검증된 상품 정보:
${productInfo || "정보 없음"}

참고영상에서 참고할 포인트:
${referencePoint || "없음"}

영상 스타일:
${tone}

목표 길이:
${duration}

중요 규칙:
- 다른 영상의 문장이나 대본을 복사하지 않는다.
- 참고영상은 훅, 전개 방식, 시청 유지 구조만 참고한다.
- 제공되지 않은 상품 성능이나 스펙을 사실처럼 만들지 않는다.
- 직접 사용하지 않았다면 직접 사용했다고 말하지 않는다.
- 첫 2초에 강한 훅을 만든다.
- 짧고 자연스러운 한국어를 사용한다.
- 약 20~30초 쇼츠에 맞춘다.
- 세로 9:16 영상 기준으로 구성한다.

반드시 아래 JSON 형식으로만 답한다.

{
  "hook": "첫 2초 훅",
  "script": "전체 TTS 대본",
  "scenes": [
    {
      "scene": 1,
      "duration": "0-5초",
      "visual": "장면 설명",
      "caption": "화면 자막"
    },
    {
      "scene": 2,
      "duration": "5-10초",
      "visual": "장면 설명",
      "caption": "화면 자막"
    },
    {
      "scene": 3,
      "duration": "10-17초",
      "visual": "장면 설명",
      "caption": "화면 자막"
    },
    {
      "scene": 4,
      "duration": "17-25초",
      "visual": "장면 설명",
      "caption": "화면 자막"
    }
  ],
  "titles": [
    "제목 후보 1",
    "제목 후보 2",
    "제목 후보 3"
  ],
  "description": "유튜브 설명",
  "hashtags": ["#꿀템", "#생활용품", "#추천템"],
  "naverClip": "네이버 클립용 짧은 문구"
}
`;

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          messages: [
            {
              role: "system",
              content:
                "You create concise, original Korean shopping short-form video plans."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: {
            type: "json_object"
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "AI 요청 중 오류가 발생했습니다."
      });
    }

    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      return res.status(500).json({
        error: "AI 응답이 비어 있습니다."
      });
    }

    let result;

    try {
      result = JSON.parse(text);
    } catch {
      result = { script: text };
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "서버 오류가 발생했습니다."
    });
  }
}
