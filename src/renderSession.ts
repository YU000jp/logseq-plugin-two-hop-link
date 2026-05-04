let activeHopLinksRenderSessionId: number | null = null
let nextHopLinksRenderSessionId = 0

export const startHopLinksRenderSession = (): number => {
             const sessionId = ++nextHopLinksRenderSessionId
             activeHopLinksRenderSessionId = sessionId
             return sessionId
}

export const isHopLinksRenderSessionActive = (sessionId: number): boolean =>
             activeHopLinksRenderSessionId === sessionId

export const endHopLinksRenderSession = (sessionId: number): void => {
             if (activeHopLinksRenderSessionId === sessionId)
                          activeHopLinksRenderSessionId = null
}
