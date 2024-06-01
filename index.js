document.addEventListener('DOMContentLoaded', function () {
	const recorder = new DigitalVoiceRecorder(
		document.getElementById('messages')
	);

	document.getElementById('recordButton').addEventListener('click', () => {
		recorder.recordMessage();
	});

	document.getElementById('playButton').addEventListener('click', () => {
		const index = prompt('Введіть індекс повідомлення для відтворення:');
		if (index !== null) {
			recorder.playMessage(parseInt(index));
		}
	});

	document.getElementById('deleteButton').addEventListener('click', () => {
		const index = prompt('Введіть індекс повідомлення для видалення:');
		if (index !== null) {
			recorder.deleteMessage(parseInt(index));
		}
	});
});

class SoundMessage {
	constructor(audioBlob) {
		this.audioBlob = audioBlob;
		this.audioUrl = URL.createObjectURL(audioBlob);
	}

	getAudioUrl() {
		return this.audioUrl;
	}
}

class SoundMessageDatabase {
	constructor() {
		this.messages = [];
		this.maxMessages = 10;
	}

	addMessage(audioBlob) {
		if (this.messages.length < this.maxMessages) {
			const soundMessage = new SoundMessage(audioBlob);
			this.messages.push(soundMessage);
			return true;
		} else {
			console.error('Memory is full. Delete some messages to add new ones.');
			return false;
		}
	}

	deleteMessage(index) {
		if (this.isValidIndex(index)) {
			URL.revokeObjectURL(this.messages[index].getAudioUrl());
			this.messages.splice(index, 1);
			console.log('Message deleted successfully.');
			return true;
		} else {
			console.error('Unable to delete message. Invalid index.');
			return false;
		}
	}

	getMessage(index) {
		if (this.isValidIndex(index)) {
			return this.messages[index];
		} else {
			console.error('Unable to retrieve message. Invalid index.');
			return null;
		}
	}

	isValidIndex(index) {
		return index >= 0 && index < this.messages.length;
	}
}

class DigitalVoiceRecorder {
	constructor(messagesElement) {
		this.messagesElement = messagesElement;
		this.database = new SoundMessageDatabase();
		this.mediaRecorder = null;
		this.audioChunks = [];
	}

	async recordMessage() {
		if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
			this.mediaRecorder.stop();
		} else {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: true,
				});
				this.mediaRecorder = new MediaRecorder(stream);
				this.mediaRecorder.ondataavailable = event => {
					this.audioChunks.push(event.data);
				};
				this.mediaRecorder.onstop = () => {
					const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
					if (this.database.addMessage(audioBlob)) {
						this.updateMessageList();
						this.audioChunks = [];
					}
				};
				this.mediaRecorder.start();
			} catch (error) {
				console.error(
					'An error occurred while trying to record the message:',
					error
				);
			}
		}
	}

	playMessage(index) {
		if (!this.database.isValidIndex(index)) {
			console.error(
				`Invalid index: ${index}. Available index range is 0 to ${
					this.database.messages.length - 1
				}.`
			);
			return;
		}

		const message = this.database.getMessage(index);
		if (message) {
			const audio = new Audio(message.getAudioUrl());
			audio.play();
		}
	}

	deleteMessage(index) {
		if (!this.database.isValidIndex(index)) {
			console.error(
				`Invalid index: ${index}. Available index range is 0 to ${
					this.database.messages.length - 1
				}.`
			);
			return;
		}

		if (this.database.deleteMessage(index)) {
			this.updateMessageList();
		}
	}

	updateMessageList() {
		this.messagesElement.innerHTML = '';
		this.database.messages.forEach((message, index) => {
			const listItem = document.createElement('li');
			listItem.textContent = `Message ${index}: [Click to play]`;
			listItem.addEventListener('click', () => this.playMessage(index));
			this.messagesElement.appendChild(listItem);
		});
	}
}
