import { Copilot } from '@/components/copilot'
import { createStreamableUI, createStreamableValue } from 'ai/rsc'
import { CoreMessage, streamObject } from 'ai'
import { PartialInquiry, inquirySchema } from '@/lib/schema/inquiry'
import { getModel } from '../utils'

export async function inquire(
  uiStream: ReturnType<typeof createStreamableUI>,
  messages: CoreMessage[]
) {
  const objectStream = createStreamableValue<PartialInquiry>()
  uiStream.update(<Copilot inquiry={objectStream.value} />)

  let finalInquiry: PartialInquiry = {}
  await streamObject({
    model: getModel(),
    system: `As a helpful and knowledgeable teacher, your role is to guide students towards a deeper understanding of the subject by asking relevant and insightful inquiries. 

    Carefully analyze the student's input and previous conversation to identify areas where further clarification or exploration is needed. Only proceed with further inquiries if they are crucial for enhancing comprehension and addressing potential knowledge gaps.

    When crafting your inquiry, structure it as follows:
    {
      "question": "A clear, concise question that targets specific learning objectives or encourages critical thinking.",
      "options": [
        {"value": "option1", "label": "A predefined option relevant to the topic"},
        {"value": "option2", "label": "Another predefined option related to the concept"},
        ...
      ],
      "allowsInput": true/false, // Indicates whether the student can provide a free-form response
      "inputLabel": "A label for the free-form input field, if allowed",
      "inputPlaceholder": "A placeholder text to guide the student's response"
    }

    Important: The "value" field in the options must always be in English, regardless of the student's language.

    For example:
    {
      "question": "Can you elaborate on the key differences between mitosis and meiosis?",
      "options": [
        {"value": "chromosomeNumber", "label": "Differences in chromosome number"},
        {"value": "stages", "label": "Variations in the stages"},
        {"value": "purpose", "label": "Distinct purposes of each process"} 
      ],
      "allowsInput": true,
      "inputLabel": "Other relevant differences",
      "inputPlaceholder": "e.g., Genetic variation"
    }

    By providing predefined options, you guide the student towards key aspects of the topic, while the free-form input allows them to demonstrate deeper understanding or unique insights. 
    Remember, your goal is to foster learning and critical thinking.
    Please match the language of the response (question, labels, inputLabel, and inputPlaceholder) to the student's language, but keep the "value" field in English. And only query for once. only one.
    `,
    messages,
    schema: inquirySchema
  })
    .then(async result => {
      for await (const obj of result.partialObjectStream) {
        if (obj) {
          objectStream.update(obj)
          finalInquiry = obj
        }
      }
    })
    .finally(() => {
      objectStream.done()
    })

  return finalInquiry
}
