export const COSTS = {
 audit_text: 2,
 audit_thumb_hook: 8,
 thumbnail_download: 10,
 thumbnail_set: 5,
 thumbnail_generate: 8,
 thumbnail_select: 3,
 kompetitor_judul: 5,
 kompetitor_deskripsi: 5,
 kompetitor_keyword: 3,
 kompetitor_tag: 3,
 kompetitor_hashtag: 2,
 dashboard_analyzeChannel: 25,
 dashboard_competitorVideo: 2,
 dashboard_contentIdea: 10,
 analytics_deep: 15,
 analytics_bestTime: 15,
 analytics_keyword: 5,
 upload_titles: 2,
 upload_desc: 4,
 upload_thumbnails: 35,
 upload_tags: 2,
 upload_keywords: 2,
 upload_schedule: 2,
 upload_suggest_schedule: 2,
 upload_apply: 2
};
export const UPLOAD_FIELDS = {titles:'upload_titles', descriptions:'upload_desc', tags:'upload_tags', keywords:'upload_keywords'};
export const PREMIUM_COSTS={hook:2,quick:2,seo:2,titles:2,copyright:2,promotion:2,cpm:2,competitors:2};
export const POINT_COSTS = {...COSTS,aiChat:5,videoToShort:15,...Object.fromEntries(Object.entries(PREMIUM_COSTS).map(([k,v])=>['premium_'+k,v])), analyzeChannel:COSTS.dashboard_analyzeChannel, generateTitles:COSTS.upload_titles, generateDescription:COSTS.upload_desc, generateThumbnails:COSTS.upload_thumbnails, generateTags:COSTS.upload_tags, uploadSchedule:COSTS.upload_schedule};
export function requestActions(path, body={}, method='POST') {
 if(['/api/ai-chat','/ai-chat'].includes(path)&&method==='POST')return ['aiChat'];
 if(path==='/api/video-to-short')return ['videoToShort'];
 if(path==='/api/audit-premium'&&method==='POST')return Object.hasOwn(PREMIUM_COSTS,body.action)?['premium_'+body.action]:[];
 if(path==='/api/kompetitor/discover' && body.action==='category')return Array.from({length:Math.min(50,Math.max(1,Number(body.count)||10))},()=> 'dashboard_competitorVideo');
 if(path==='/api/kompetitor/content')return ['judul','deskripsi','keyword','tag','hashtag'].includes(body.type)?['kompetitor_'+body.type]:[];
 if(path==='/api/kompetitor-ai')return ['dashboard_contentIdea'];
 if(path==='/api/youtube-audit' && method==='POST')return ['audit_text'];
 if(path==='/api/youtube-audit' && method==='GET')return ['dashboard_analyzeChannel'];
 if(path==='/api/analytics-ai')return ['deep','bestTime','keyword'].includes(body.action)?['analytics_'+body.action]:['analyzeChannel','competitorVideo','contentIdea'].includes(body.action)?['dashboard_'+body.action]:[];
 if(path==='/api/upload/suggest-schedule')return ['upload_suggest_schedule'];
 if(path==='/api/upload/apply')return ['upload_apply'];
 if(['/api/upload-analyze','/api/upload/generate'].includes(path))return body.section && UPLOAD_FIELDS[body.section]?[UPLOAD_FIELDS[body.section]]:['upload_titles','upload_desc','upload_tags'];
 if(path==='/api/thumbnail/download')return ['thumbnail_download'];
 if(['/api/youtube-thumbnail','/api/upload-thumbnail'].includes(path))return ['thumbnail_set'];
 if(path==='/api/thumbnail/generate')return ['thumbnail_generate'];
 if(path==='/api/audit-thumb-bg')return ['upload_thumbnails'];
 if(['/api/upload','/api/youtube-upload','/api/youtube-upload-short'].includes(path))return ['upload_schedule'];
 if(['/api/generate/tiru','/api/generate-tiru'].includes(path))return body.tipe==='hashtag_list'?[]:[body.tipe==='hashtag'?'upload_tags':body.tipe==='deskripsi'?'upload_desc':'upload_titles'];
 if(['/api/ai-suggest','/api/audit/generate'].includes(path))return [...new Set((body.fields||[]).map(f=>({titles:'audit_text',descs:'audit_text',hooks:'audit_thumb_hook',tags:'audit_text',hashtags:'audit_text'}[f])).filter(Boolean))];
 if(path==='/api/audit-ai')return body.part==='thumbs'?['audit_thumb_hook']:['audit_text'];
 return [];
}
