const Sauce = require('../models/sauce');
const fs = require('fs');
const sauce = require('../models/sauce');

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(500).json({error}));
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id})
      .then(sauce => res.status(200).json(sauce))
      .catch(error => res.status(400).json({error}))
};

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    const sauce = new Sauce ({
        ...sauceObject,
        userId: req.auth.userId,
        imageUrl : `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    sauce.save()
        .then(() => {res.status(201).json({message: 'Sauce enregistrée !'})})
        .catch(error => res.status(400).json({error}))
};

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ? {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : {...req.body };

    delete sauceObject._userId;
    Sauce.findOne({_id: req.params.id})
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message : 'Non-autorisé' });
      } else {
        Sauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id})
        .then(() => res.status(200).json({message: 'Objet Modifié!'}))
        .catch(error => res.status(401).json ({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    })
};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
    .then(sauce => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({message: 'Non-autorisé'});
      } else {
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({_id: req.params.id})
            .then(() => {res.status(200).json({message: 'Objet supprimé !'})})
            .catch(error => res.status(401).json({ error }));
        });
      }
    })
    .catch( error => {
      res.status(500).json({ error });
    });
};

exports.likeSauce = (req, res) => {
  const userId = req.auth.userId;
  Sauce.findOne({ _id: req.params.id })
  .then(sauce => {
    if (req.body.like === 1) {
      if (sauce.usersLiked.includes(userId)) {
        return res.status(401).json({error: 'Sauce déjà liké'});
      } else {
        return Sauce.updateOne({ _id: req.params.id }, { $inc: { likes: 1 }, $push: { usersLiked: userId } })
            .then(() => res.status(200).json({ message: 'Merci pour votre soutien !' }))
            .catch(error => res.status(400).json({ error }))
      }
    }  else if (req.body.like === -1) {
      if (sauce.usersDisliked.includes(userId)) {
        return res.status(401).json({error: 'Sauce déjà disliké'});
      } else {
        return Sauce.updateOne({ _id: req.params.id }, { $inc: { dislikes: 1 }, $push: { usersDisliked: userId } })
            .then(() => res.status(200).json({ message: 'Dislike ajouté !' }))
            .catch(error => res.status(400).json({ error }));
      }
    } else {
      if (sauce.usersLiked.includes(userId)) {
        return Sauce.updateOne({ _id: req.params.id }, { $pull: { usersLiked: userId }, $inc: { likes: -1 } })
            .then(() => res.status(200).json({ message: 'Like supprimé !' }))
            .catch(error => res.status(400).json({ error }));
      } else if (sauce.usersDisliked.includes(userId)) {
        return Sauce.updateOne({ _id: req.params.id }, { $pull: { usersDisliked: userId }, $inc: { dislikes: -1 } })
            .then(() => res.status(200).json({ message: 'Dislike supprimé !' }))
            .catch(error => res.status(400).json({ error }));
      }
    }
  })
  .catch(error => res.status(400).json({ error })); 
};