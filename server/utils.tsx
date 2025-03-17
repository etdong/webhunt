/**
 * Generates a random string of a specified length using a predefined character set.
 *
 * @param length - The length of the random string to generate.
 * @returns A random string of the specified length.
 */
function generateRandomString(length: number) {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
 
    for (let i = 0; i < length; i++) {
       const randomIndex = Math.floor(Math.random() * charset.length);
       result += charset[randomIndex];
    }
 
    return result;
}