from abc import ABC, abstractmethod


class BaseAgent(ABC):
    @abstractmethod
    def execute(self, task_definition_path: str):
        pass
