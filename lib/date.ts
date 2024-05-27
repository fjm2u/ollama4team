

const date_to_str = (date: string): string => {
    if (!date) return ""
    const d = new Date(date)
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
}

export { date_to_str }