import z from 'zod'

export async function validateUser(object){

    const user=z.object({
        "username":z.string().max(100),
        "user_password":z.string(),
        "creation_date":z.iso.date(),
        "country":z.string().max(100),
        "city":z.string().max(100),
        "email":z.email(),
        "image":z.httpUrl(),
        "name":z.string().max(100),
        "surname":z.string().max(100)
    })

    const result = await z.safeParseAsync(user, object)

    return result

}