package com.retail.domain.qa;

/**
 * Statistics for product Q&A section.
 */
public class QAStatistics {
    private Integer totalQuestions;
    private Integer answeredQuestions;

    public QAStatistics(Integer totalQuestions, Integer answeredQuestions) {
        this.totalQuestions = totalQuestions;
        this.answeredQuestions = answeredQuestions;
    }

    public Integer getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(Integer totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public Integer getAnsweredQuestions() {
        return answeredQuestions;
    }

    public void setAnsweredQuestions(Integer answeredQuestions) {
        this.answeredQuestions = answeredQuestions;
    }

    public Integer getUnansweredQuestions() {
        return totalQuestions - answeredQuestions;
    }

    public double getAnsweredPercentage() {
        if (totalQuestions == 0) return 0;
        return (double) answeredQuestions / totalQuestions * 100;
    }
}
