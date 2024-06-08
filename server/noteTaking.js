async function takeNote(app, pool) {
	app.post("/users/bible", async (req, res) => {
		const { defaultRender } = require("./defaultValues");
		const defaultBook = req.query.book || "John";
		const defaultChapter = parseInt(req.query.chapter) || 1;

		const bookTitleOptionsQuery = `SELECT DISTINCT book, book_order FROM bible_eng ORDER BY book_order;`;
		const bookChaptersQuery = `SELECT DISTINCT chapter_number FROM bible_eng WHERE book = $1 ORDER BY chapter_number`;
		const bookTextQuery = `SELECT * FROM bible_eng WHERE book = $1 AND chapter_number = $2 ORDER BY verse_number`;

		const [bookTitleOptionRes, bookChaptersRes, bookTextRes] =
			await Promise.all([
				pool.query(bookTitleOptionsQuery),
				pool.query(bookChaptersQuery, [defaultBook]),
				pool.query(bookTextQuery, [defaultBook, defaultChapter]),
			]);

		const bookTitles = bookTitleOptionRes.rows.map((row) => row.book);
		const chapters = bookChaptersRes.rows.map((row) => row.chapter_number);
		const bookText = bookTextRes.rows;

		let nextBook = defaultBook;
		let nextChapter = defaultChapter + 1;
		let previousBook = defaultBook;
		let previousChapter = defaultChapter - 1;

		// PAGINATION
		if (nextChapter > chapters.length) {
			const currentBookIndex = bookTitles.indexOf(defaultBook);
			nextBook = bookTitles[(currentBookIndex + 1) % bookTitles.length];
			const nextChapterRes = await pool.query(bookChaptersQuery, [nextBook]);
			nextChapter = nextChapterRes.rows[0].chapter_number;
		}
		if (previousChapter < 1) {
			const currentBookIndex = bookTitles.indexOf(defaultBook);
			previousBook =
				bookTitles[
					(currentBookIndex - 1 + bookTitles.length) % bookTitles.length
				];
			const previousChapterRes = await pool.query(bookChaptersQuery, [
				previousBook,
			]);
			previousChapter =
				previousChapterRes.rows[previousChapterRes.rows.length - 1]
					.chapter_number;
		}

		const isAuth = req.isAuthenticated();
		const renderData = {
			bookText: bookText,
			bookChapters: chapters,
			bookTitleOptions: bookTitles,
			selectedBook: defaultBook,
			selectedChapter: defaultChapter,
			nextBook: nextBook,
			nextChapter: nextChapter,
			previousBook: previousBook,
			previousChapter: previousChapter,
		};

		if (isAuth) {
			await defaultRender(
				req,
				res,
				true,
				"../public/views/scripture",
				renderData
			);
		} else {
			await defaultRender(
				req,
				res,
				false,
				"../public/views/scripture",
				renderData
			);
		}

		const { defaultRender } = require("./defaultValues");
		let { noteText } = req.body;

		const result = await pool.query(
			`INSERT INTO notes (text)
				VALUES ($1)
				RETURNING id, text`,
			[noteText]
		);
		console.table([result.rows]);
		if (isAuth) {
			await defaultRender(
				req,
				res,
				true,
				"../public/views/scripture",
				renderData
			);
		} else {
			await defaultRender(
				req,
				res,
				false,
				"../public/views/scripture",
				renderData
			);
		}
	});
}

module.exports = { takeNote };
