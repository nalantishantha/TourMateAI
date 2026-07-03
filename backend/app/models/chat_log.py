"""ChatLog model — chatbot conversation history.

`response` is populated by the teammate's RAG chatbot feature.
"""

from datetime import datetime

from ..extensions import db


class ChatLog(db.Model):
    __tablename__ = "ChatLogs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("Users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    message = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text)  # filled in by the chatbot
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="chat_logs")

    def __repr__(self):
        return f"<ChatLog {self.id} u{self.user_id}>"
