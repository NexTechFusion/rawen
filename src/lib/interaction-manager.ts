import { appState, changeState } from "@/state/app.state";
import {
  AppStateModel,
  InlineElementConfirmation,
} from "../../shared/models/app-state.model";
import { getConvoId, randomUUID } from "./utils";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

export function getInteractionHistory(convoId: string) {
  const state = appState as AppStateModel;
  const history = state?.llmResults.find((h) => h.convoId === convoId);

  const formatted = history?.results.map((r) => {
    const prompt = new HumanMessage({
      content: r.header
    });
    const response = new AIMessage({
      content: r.content
    });

    return [prompt, response];
  }).flat();

  return formatted;
}

export async function startStreamer(convoId: string) {
  addNewInteractionIfNotExists(convoId);
  addPromptIfNotExists(convoId);
}

export function addNewInteractionIfNotExists(convoId: string) {
  const state = appState as AppStateModel;

  if (!convoId) {
    return;
  }

  const history = state?.llmResults.find((h) => h.convoId === convoId);
  if (!history) {
    streamedOutputTxt = "";
    // cut off when more than 20
    if (state?.llmResults.length > 20) {
      state.llmResults = state?.llmResults.slice(0, 20);
    }

    state?.llmResults.push({
      convoId,
      results: [],
    });

    changeState({
      ...appState,
      llmResults: [...state?.llmResults],
    });
  }
}

export function addInteractionInlineElement(
  convoId: string,
  elementer: InlineElementConfirmation
) {
  const state = appState as AppStateModel;
  addNewInteractionIfNotExists(convoId);
  addPromptIfNotExists(convoId);

  const history = state?.llmResults.find((h) => h.convoId === convoId);
  if (history) {
    const lastItem = history.results[0];
    if (lastItem) {
      lastItem.confirmElements =
        lastItem.confirmElements == undefined
          ? [elementer]
          : [...lastItem.confirmElements, elementer];
      lastItem.content = lastItem.content ?? "";
    }

    changeState({
      ...appState,
      llmResults: [...state?.llmResults],
    });
  }
}

function addPromptIfNotExists(convoId: string) {
  addInteractionPrompt(convoId, undefined);
}

export function updateLastInteractionPrompt(convoId: string, prompt: string) {
  const state = appState as AppStateModel;
  addNewInteractionIfNotExists(convoId);

  const history = state?.llmResults.find((h) => h.convoId === convoId);
  if (history) {
    const lastItem = history.results[history.results.length - 1];
    if (lastItem) {
      lastItem.header = prompt;
    }

    changeState({
      ...appState,
      llmResults: [...state?.llmResults],
    });
  } else {
    addInteractionPrompt(convoId, prompt);
  }
}

export function updateLastInteractionResponse(
  convoId: string,
  response: string
) {
  const state = appState as AppStateModel;
  addNewInteractionIfNotExists(convoId);

  if (!convoId) {
    return;
  }

  const history = state?.llmResults.find((h) => h.convoId === convoId);
  if (history) {
    const lastItem = history.results[history.results.length - 1];
    if (lastItem) {
      lastItem.content = response;
      streamedOutputTxt = "";
    }

    changeState({
      ...appState,
      llmResults: [...state?.llmResults],
    });
  }
}

let streamedOutputTxt = "";
export function addStreamed(t: string) {
  streamedOutputTxt += t;
}

export function replaceStreamed(t: string, replace: string) {
  streamedOutputTxt = streamedOutputTxt.replace(t, replace);
}

export function isStreamActive(convoId = getConvoId()) {
  const state = appState as AppStateModel;
  const history = state?.llmResults.find((h) => h.convoId === convoId);
  if (history) {
    const lastItem = history.results[0];
    if (lastItem) {
      return lastItem.content == undefined || lastItem.content == "";
    }
  }
  return false;
}

export function assignStreamedToLastInteraction(convoId: string) {
  const state = appState as AppStateModel;
  addNewInteractionIfNotExists(convoId);

  const history = state?.llmResults.find((h) => h.convoId === convoId);
  if (history) {
    const lastItem = history.results[0];
    if (lastItem) {
      lastItem.content = streamedOutputTxt;
    }

    changeState({
      ...appState,
      llmResults: [...state?.llmResults],
    });
  }

  streamedOutputTxt = "";
}

export function addRetry(convoId: string, prompt: string, commands = null) {
  const state = appState as AppStateModel;
  addNewInteractionIfNotExists(convoId);

  const history = state?.llmResults.find((h) => h.convoId === convoId);
  if (history) {
    history.results.forEach((item) => {
      item.isRetry = true;
    });

    const newInteraction = {
      header: prompt,
      date: new Date(),
      commands,
      id: randomUUID(),
    };

    history.results.unshift(newInteraction);

    changeState({
      ...appState,
      llmResults: [...state?.llmResults],
    });
  }
}

export function addInteractionPrompt(
  convoId: string,
  prompt: string,
  commands = null
) {
  const state = appState as AppStateModel;
  addNewInteractionIfNotExists(convoId);

  const history = state?.llmResults.find((h) => h.convoId === convoId);

  const latest = history?.results[0];
  if (
    latest &&
    (latest.content == undefined || latest.content == "") &&
    streamedOutputTxt
  ) {
    latest.content = streamedOutputTxt;
    streamedOutputTxt = "";
  }

  const newInteraction = {
    header: prompt,
    date: new Date(),
    commands,
    id: randomUUID(),
  };
  if (history) {
    history.results.unshift(newInteraction);
  } else {
    state?.llmResults.unshift({
      convoId,
      results: [newInteraction],
    });
  }

  changeState({
    ...appState,
    llmResults: [...state?.llmResults],
  });
}

export function addInteractionContentR(
  response: string,
  convoId = getConvoId(),
  options = null
) {
  const state = appState as AppStateModel;
  addNewInteractionIfNotExists(convoId);

  const history = state?.llmResults.find((h) => h.convoId === convoId);
  if (history) {
    const lastItemWithoutResult = history.results.find((r) => !r.content);

    if (lastItemWithoutResult) {
      lastItemWithoutResult.content = response;
      lastItemWithoutResult.date = new Date();
    } else {
      history.results.unshift({
        ...options,
        header: "",
        content: response,
        date: new Date(),
      });
    }

    changeState({
      ...appState,
      llmResults: [...state?.llmResults],
    });
  }
}

export function setInteractionSources(convoId: string, sources: any[]) {
  const state = appState as AppStateModel;

  if (sources == null || sources.length == 0) {
    return;
  }

  addNewInteractionIfNotExists(convoId);
  const history = state?.llmResults.find((h) => h.convoId === convoId);
  if (history) {
    const lastItem = history.results[0];

    if (lastItem) {
      lastItem.sources = sources;
    }

    changeState({
      ...appState,
      llmResults: [...state?.llmResults],
    });
  }
}

export function addInteractionLog(log: string, convoId = getConvoId()) {
  const state = appState as AppStateModel;
  addNewInteractionIfNotExists(convoId);

  const history = state?.llmResults.find((h) => h.convoId === convoId);
  if (history) {
    const lastItem = history.results[0];
    if (lastItem) {
      lastItem.logs = (lastItem.logs ?? "") + log;
    }

    changeState({
      ...appState,
      llmResults: [...state?.llmResults],
    });
  }
}
