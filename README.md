## Ollama4Team
Ollama4Team is a proxy for Ollama that provides

- Web interface
- Member management
- Authentication
- Usage statistics
- Model management

## Installation
### Clone this repository
```bash
git clone https://github.com/fjm2u/ollama4team.git
cd ollama4team
```

### Edit `.env` file
```bash
cp .env.example .env
vi .env
```

### Docker-compose up
#### CPU only mode
```bash
docker-compose -f docker-compose.cpu.yml up -d --build
```

#### Nvidia GPU
Install [Nvidia Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html) and configure [docker](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#configuring-docker) to use Nvidia GPU.
Then,
```bash
docker-compose -f docker-compose.gpu.yml up -d --build
```

AMD GPU
```bash
docker-compose -f docker-compose.amd-gpu.yml up -d --build
```

3.Access to the web interface at `http://localhost:3000`


## Getting Started

### Panel
Usage statistics
![Stats](./docs/images/stats.png)

Users
![Users](./docs/images/users.png)

Models
![Add-model](./docs/images/add-model.png)

### API
Generate
```bash
curl -X POST -H "Content-Type: application/json" -H "Authorization: Basic YOUR_PASSWORD" -d '{"model": "YOUR_MODEL", "prompt": "YOUR_PROMPT"}' "https://OLLAMA4TEAM_URL/api/generate"
```
Embedding
```bash
curl -X POST -H "Content-Type: application/json" -H "Authorization: Basic YOUR_PASSWORD" -d '{"model": "YOUR_MODEL", "prompt": "YOUR_PROMPT"}' "https://OLLAMA4TEAM_URL/api/embeddings"
```

### Use with Langchain

<details>
<summary>
Custom Classes are defined by below.
</summary>


```python
from typing import Any, Dict, Iterator, List, Optional

import requests
from langchain_community.llms import Ollama
from langchain_community.embeddings import OllamaEmbeddings


class Ollama4Team(Ollama):
    """Ollama4Team is designed for team usage of Ollama.
    Ref: https://github.com/langchain-ai/langchain/blob/cccc8fbe2fe59bde0846875f67aa046aeb1105a3/libs/community/langchain_community/llms/ollama.py

    Example:

        .. code-block:: python

            model = Ollama4Team(api_key="", model="llama2:13b")
            result = model.invoke([HumanMessage(content="hello")])
    """

    """The default parameters for the Ollama API."""
    password: str
    base_url: str = "http://localhost:3000"

    def _create_stream(
        self,
        api_url: str,
        payload: Any,
        stop: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> Iterator[str]:
        if self.stop is not None and stop is not None:
            raise ValueError("`stop` found in both the input and default params.")
        elif self.stop is not None:
            stop = self.stop

        params = self._default_params

        for key in self._default_params:
            if key in kwargs:
                params[key] = kwargs[key]

        if "options" in kwargs:
            params["options"] = kwargs["options"]
        else:
            params["options"] = {
                **params["options"],
                "stop": stop,
                **{k: v for k, v in kwargs.items() if k not in self._default_params},
            }

        if payload.get("messages"):
            request_payload = {"messages": payload.get("messages", []), **params}
        else:
            request_payload = {
                "prompt": payload.get("prompt"),
                "images": payload.get("images", []),
                **params,
            }

        response = requests.post(
            url=api_url,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Basic {self.password}",
                **(self.headers if isinstance(self.headers, dict) else {}),
            },
            json=request_payload,
            stream=True,
            timeout=self.timeout,
        )
        response.encoding = "utf-8"
        if response.status_code != 200:
            if response.status_code == 404:
                raise self.OllamaEndpointNotFoundError(
                    "Ollama call failed with status code 404. "
                    "Maybe your model is not found "
                    f"and you should pull the model with `ollama pull {self.model}`."
                )
            else:
                optional_detail = response.text
                raise ValueError(
                    f"Ollama call failed with status code {response.status_code}."
                    f" Details: {optional_detail}"
                )
        return response.iter_lines(decode_unicode=True)

    @property
    def _identifying_params(self) -> Dict[str, Any]:
        """Return a dictionary of identifying parameters."""
        return {
            # The model name allows users to specify custom token counting
            # rules in LLM monitoring applications (e.g., in LangSmith users
            # can provide per token pricing for their model and monitor
            # costs for the given LLM.)
            "model_name": self.model,
        }

    @property
    def _llm_type(self) -> str:
        """Get the type of language model used by this chat model. Used for logging purposes only."""
        return "Ollama4Team"


class Ollama4TeamEmbeddings(OllamaEmbeddings):
    password: str
    base_url: str = "http://localhost:3000"
    def _process_emb_response(self, input: str) -> List[float]:
        """Process a response from the API.

        Args:
            response: The response from the API.

        Returns:
            The response as a dictionary.
        """
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Basic {self.password}",
            **(self.headers or {}),
        }

        try:
            res = requests.post(
                f"{self.base_url}/api/embeddings",
                headers=headers,
                json={"model": self.model, "prompt": input, **self._default_params},
            )
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Error raised by inference endpoint: {e}")

        if res.status_code != 200:
            raise ValueError(
                "Error raised by inference API HTTP code: %s, %s"
                % (res.status_code, res.text)
            )
        try:
            t = res.json()
            return t["embedding"]
        except requests.exceptions.JSONDecodeError as e:
            raise ValueError(
                f"Error raised by inference API: {e}.\nResponse: {res.text}"
            )


llm = Ollama4Team(model="llama3", password="password", base_url="http://localhost:3000")
# print(llm.invoke("The first man on the moon was ... think step by step"))
for chunk in llm.stream("Write me a 1 verse song about sparkling water."):
    print(chunk, end="|", flush=True)


embeddings = Ollama4TeamEmbeddings(model="llama3", password="password", base_url="http://localhost:3000")
text = "This is a test document."
query_result = embeddings.embed_query(text)
print(query_result[:5])
doc_result = embeddings.embed_documents([text])
print(doc_result[0][:5])

```
</details>

```python
llm = Ollama4Team(model="llama3", password="password", base_url="http://localhost:3000")
for chunk in llm.stream("Write me a 1 verse song about sparkling water."):
    print(chunk, end="|", flush=True)

embeddings = Ollama4TeamEmbeddings(model="llama3", password="password", base_url="http://localhost:3000")
text = "This is a test document."
query_result = embeddings.embed_query(text)
print(query_result[:5])
```

## Contributing
PRs are welcome!
Please follow the [Contribution Guide](./CONTRIBUTING.md).
