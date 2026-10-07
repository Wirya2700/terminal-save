export class CwdTracker {
  private cwdByDocument = new Map<number, string>()

  setCwd(documentId: number, path: string): void {
    const normalized = path.trim()
    if (!normalized) return
    this.cwdByDocument.set(documentId, normalized)
  }

  getCwd(documentId: number): string {
    return this.cwdByDocument.get(documentId) ?? ''
  }

  remove(documentId: number): void {
    this.cwdByDocument.delete(documentId)
  }

  entries(): Array<[number, string]> {
    return Array.from(this.cwdByDocument.entries())
  }
}

export const cwdTracker = new CwdTracker()
