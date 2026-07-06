"""Feedback model — user ratings/comments on attractions."""

from datetime import datetime

from ..extensions import db


class Feedback(db.Model):
    __tablename__ = "Feedback"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("Users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    attraction_id = db.Column(
        db.Integer,
        db.ForeignKey("Attractions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rating = db.Column(db.Integer, nullable=False)  # 1–5
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="feedback")
    attraction = db.relationship("Attraction", back_populates="feedback")

    def __repr__(self):
        return f"<Feedback {self.id} a{self.attraction_id} {self.rating}★>"
