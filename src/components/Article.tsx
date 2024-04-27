import './componentStyles/article.css';

function Article( {...props} ) {
    const article = props.article;
    const content = article.content.replace(/\[[^\]]*\]/, '');

    const domainRegex = /^(https?:\/\/[^/]+?\.com)/;
    const shortenedURL = article.url.match(domainRegex)[0];

    return (
        <div id='newsContainer'>
            <div id='newsContentContainer'>
                <h1 id='newsArticleTitle'>{article.title}</h1>
                <h2 id='newsArticleSubtitle'>{article.description}</h2>
                <p id='newsArticleAuthor'>{article.author}</p>
                <img id='newsArticleImg' src={article.urlToImage} alt={article.title}/>
                <p id='newsArticleContent'>{content}</p>
                <span id='newsLinkSpan'>Full story here: <a href={article.url} target='_blank' id='newsArticleLink'>{shortenedURL}</a></span>
            </div>
        </div>
    )
}

export default Article;