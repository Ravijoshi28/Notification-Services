export function ErrorMsg(error) {
    console.error("Error:", error);
    return { message: "Internal Server Error" };
}
