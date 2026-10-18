import crypto from "node:crypto"

export async function Hash_api(api){

    return crypto.createHash("sha256").update(api).digest("hex")

}

