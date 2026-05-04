/**
 * Creates the common label/input/popup shell used by interactive hop-link rows.
 */
export const createTooltipRowShell = (inputType: HTMLInputElement["type"] = "checkbox") => {
             const labelElement: HTMLLabelElement = document.createElement("label")
             const inputElement: HTMLInputElement = document.createElement("input")
             inputElement.type = inputType

             const popupElement: HTMLDivElement = document.createElement("div")
             popupElement.classList.add("hopLinks-popup-content")
             popupElement.title = ""

             return {
                          labelElement,
                          inputElement,
                          popupElement,
             }
}
