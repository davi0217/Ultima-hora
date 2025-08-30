import z from 'zod'

export async function validateNews(object){

    const news=z.object({
        "header":z.string().max(500),
        "section":z.enum(["Carrera", "Amor","Gente", "Viajes", "Opinión", "En pasado"]),
        "image":z.url(),
        "title":z.string().max(500).min(10),
        "subtitle":z.string().max(700).min(10),
        "content":z.string().min(500),
        "caption":z.string().max(700).min(10).optional()
    })

   

    const result = await z.safeParseAsync(news, object)
    
    return result

}