export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({error:"POST only"});
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({error:"OPENAI_API_KEY가 설정되지 않았어요."});
  const {referenceUrl="", killingPoint="", product="", facts="", tone="빠른 꿀템형", seconds="25초"} = req.body || {};
  if (!product || !facts) return res.status(400).json({error:"상품명과 확인된 특징이 필요해요."});

  const prompt = `너는 한국 쇼핑 숏폼 전문 기획자다.
상품: ${product}
검증된 정보: ${facts}
참고 URL: ${referenceUrl || "없음"}
참고할 킬링포인트: ${killingPoint || "없음"}
톤: ${tone}
길이: ${seconds}

중요 규칙:
- 참고영상의 문장/장면을 복제하지 말고 구조적 아이디어만 참고한다.
- 입력되지 않은 가격, 성능, 인증, 할인, 사용후기는 만들어내지 않는다.
- 직접 써보지 않았으므로 '제가 써봤는데' 같은 허위 체험 표현 금지.
- 첫 2초 훅이 강하고, 짧고 자연스러운 한국어로 쓴다.
- 결과만 출력한다.

아래 형식으로 작성:
[HOOK]
[25초 내외 SCRIPT / TTS]
[4-CUT VIDEO PLAN] 각 컷 시간+화면+9:16 생성 프롬프트
[CAPTIONS] 4개
[YOUTUBE] 제목 3개 / 설명 / 해시태그
[NAVER CLIP] 제목 / 짧은 설명
[DISCLOSURE] 제휴 링크가 사용될 때 넣을 경제적 이해관계 표시 문구`;

  try {
    const r = await fetch("https://api.openai.com/v1/responses", {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.OPENAI_API_KEY}`},
      body:JSON.stringify({model:"gpt-5.4-mini", input:prompt})
    });
    const data=await r.json();
    if(!r.ok) return res.status(r.status).json({error:data?.error?.message || "OpenAI API 오류"});
    let text=data.output_text;
    if(!text && Array.isArray(data.output)){
      text=data.output.flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join("\n");
    }
    return res.status(200).json({text:text||"응답 텍스트를 찾지 못했어요."});
  } catch(e){ return res.status(500).json({error:e.message}); }
}